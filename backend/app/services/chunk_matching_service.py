"""
Sub-Segment Chunk Matching Engine
==================================
Splits segments into sentence-level and phrase-level chunks,
then matches each chunk independently against the Translation Memory.

This dramatically reduces LLM calls by finding TM matches at granular level
instead of requiring the entire segment to match.

Match Hierarchy:
  Level 1 (Full Segment):  Score >= EXACT_THRESHOLD  → Use TM translation directly
  Level 2 (Sentence):      Split by sentence, match each sentence chunk
  Level 3 (Phrase/N-gram): For still-unmatched partial content
  Level 0 (LLM):           Only for chunks with zero TM presence at any level
"""

import re
import logging
from typing import List, Dict, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.services.retrieval_service import retrieve_tm_matches
from app.config import settings

logger = logging.getLogger(__name__)

# ─── Sentence Splitter ────────────────────────────────────────────────────────

def split_into_sentences(text: str) -> List[str]:
    """
    Splits a paragraph/segment into individual sentences.
    Handles abbreviations, decimal numbers, and edge cases.
    """
    # Split on sentence-ending punctuation followed by whitespace + capital
    sentence_endings = re.compile(
        r'(?<=[.!?])\s+(?=[A-Z0-9\u00C0-\u024F])'  # Unicode uppercase included
    )
    raw_sentences = sentence_endings.split(text.strip())
    # Filter out very short fragments (< 5 chars)
    return [s.strip() for s in raw_sentences if len(s.strip()) >= 5]


def split_into_phrases(text: str, n: int = 5) -> List[str]:
    """
    Splits text into overlapping n-gram phrases for sub-sentence matching.
    e.g., "CloudSync needs RAM" → ["CloudSync needs", "needs RAM", ...]
    """
    words = text.split()
    if len(words) <= n:
        return [text]
    phrases = []
    for i in range(0, len(words) - n + 1, max(1, n // 2)):
        phrases.append(" ".join(words[i:i+n]))
    return phrases


# ─── 3-Level Hierarchical Chunk Matcher ───────────────────────────────────────

class ChunkMatchResult:
    """Holds the result of hierarchical chunk matching for a single segment."""
    
    def __init__(self):
        self.full_match: Optional[Dict] = None          # Level 1 result
        self.sentence_matches: List[Dict] = []          # Level 2 results (per sentence)
        self.unmatched_sentences: List[str] = []        # Sentences that need LLM
        self.phrase_context: List[Dict] = []            # Level 3 context hints
        self.overall_match_type: str = "new"            # "exact" / "fuzzy" / "partial" / "new"
        self.overall_score: float = 0.0
        self.needs_llm: bool = True
        self.stitched_translation: Optional[str] = None # Pre-built translation from TM hits


async def hierarchical_chunk_match(
    db: AsyncSession,
    project_id: UUID,
    source_language: str,
    target_language: str,
    source_text: str
) -> ChunkMatchResult:
    """
    Performs 3-level hierarchical TM matching on a segment.
    
    Returns a ChunkMatchResult that tells the translation engine:
    - Whether the full segment matched (skip LLM entirely)
    - Which individual sentences matched (only send unmatched ones to LLM)
    - Context hints from phrase-level matching (enrich LLM prompts)
    """
    result = ChunkMatchResult()
    
    if not source_text or not source_text.strip():
        result.needs_llm = False
        return result

    # ── LEVEL 1: Full Segment Match ─────────────────────────────────────────
    try:
        full_retrieval = await retrieve_tm_matches(
            db=db,
            project_id=project_id,
            source_language=source_language,
            target_language=target_language,
            source_text=source_text,
            top_k=1
        )
        
        best = full_retrieval.get("best_match")
        match_type = full_retrieval.get("best_match_type", "new")
        
        if match_type in ("exact", "fuzzy") and best:
            result.full_match = best
            result.overall_match_type = match_type
            result.overall_score = best.get("score", 0.0)
            result.stitched_translation = best.get("target_text", "")
            result.needs_llm = False  # Full match found, skip LLM
            logger.debug(f"[Chunk-L1] Full {match_type} match ({result.overall_score:.2f}) for: '{source_text[:60]}'")
            return result
    except Exception as e:
        logger.warning(f"[Chunk-L1] Full segment retrieval failed: {e}")

    # ── LEVEL 2: Sentence-Level Matching ────────────────────────────────────
    sentences = split_into_sentences(source_text)
    
    if len(sentences) > 1:
        matched_translations = []
        unmatched_sentences = []
        total_score = 0.0
        matched_count = 0
        
        for sentence in sentences:
            try:
                sent_retrieval = await retrieve_tm_matches(
                    db=db,
                    project_id=project_id,
                    source_language=source_language,
                    target_language=target_language,
                    source_text=sentence,
                    top_k=1
                )
                
                sent_match_type = sent_retrieval.get("best_match_type", "new")
                sent_best = sent_retrieval.get("best_match")
                
                if sent_match_type in ("exact", "fuzzy") and sent_best:
                    score = sent_best.get("score", 0.0)
                    matched_translations.append({
                        "source": sentence,
                        "translation": sent_best.get("target_text", ""),
                        "match_type": sent_match_type,
                        "score": score
                    })
                    total_score += score
                    matched_count += 1
                    logger.debug(f"[Chunk-L2] Sentence {sent_match_type} ({score:.2f}): '{sentence[:50]}'")
                else:
                    unmatched_sentences.append(sentence)
                    logger.debug(f"[Chunk-L2] No match for sentence: '{sentence[:50]}'")
                    
            except Exception as e:
                logger.warning(f"[Chunk-L2] Sentence retrieval failed: {e}")
                unmatched_sentences.append(sentence)
        
        result.sentence_matches = matched_translations
        result.unmatched_sentences = unmatched_sentences
        
        if matched_count > 0:
            result.overall_score = total_score / len(sentences)  # Weighted by proportion
            
            if not unmatched_sentences:
                # ALL sentences matched → stitch them together, no LLM needed
                result.stitched_translation = " ".join(
                    m["translation"] for m in matched_translations
                )
                result.overall_match_type = "partial_exact" if all(
                    m["match_type"] == "exact" for m in matched_translations
                ) else "partial_fuzzy"
                result.needs_llm = False
                logger.info(f"[Chunk-L2] All {matched_count} sentences matched. LLM skipped.")
            else:
                # PARTIAL match → LLM only needs to translate unmatched sentences
                result.overall_match_type = "partial"
                result.needs_llm = True  # Still needs LLM but for fewer sentences
                logger.info(
                    f"[Chunk-L2] Partial: {matched_count}/{len(sentences)} sentences matched. "
                    f"LLM will only translate {len(unmatched_sentences)} sentences."
                )

    # ── LEVEL 3: Phrase-Level Context Hints (for LLM enrichment) ────────────
    if result.needs_llm and len(source_text.split()) > 4:
        phrases = split_into_phrases(source_text, n=4)[:3]  # Top 3 phrases only
        phrase_hints = []
        
        for phrase in phrases:
            try:
                phrase_retrieval = await retrieve_tm_matches(
                    db=db,
                    project_id=project_id,
                    source_language=source_language,
                    target_language=target_language,
                    source_text=phrase,
                    top_k=1
                )
                p_best = phrase_retrieval.get("best_match")
                if p_best and phrase_retrieval.get("best_match_type") in ("exact", "fuzzy"):
                    phrase_hints.append({
                        "source_phrase": phrase,
                        "target_phrase": p_best.get("target_text", "")[:100]
                    })
            except Exception:
                pass
        
        result.phrase_context = phrase_hints
        if phrase_hints:
            logger.debug(f"[Chunk-L3] {len(phrase_hints)} phrase hints found for LLM context")

    return result


def build_chunk_context_for_prompt(chunk_result: ChunkMatchResult) -> str:
    """
    Formats chunk matching results into a rich context block for the LLM prompt.
    Tells the LLM exactly which parts are already translated and what style to follow.
    """
    lines = []
    
    if chunk_result.sentence_matches:
        lines.append("PRE-TRANSLATED SENTENCES (already matched from memory — maintain style):")
        for m in chunk_result.sentence_matches:
            lines.append(f"  Source: {m['source']}")
            lines.append(f"  Translation: {m['translation']}")
    
    if chunk_result.phrase_context:
        lines.append("\nPHRASE TRANSLATION HINTS (use these exact terms):")
        for hint in chunk_result.phrase_context:
            lines.append(f"  '{hint['source_phrase']}' → '{hint['target_phrase']}'")
    
    return "\n".join(lines)


def get_sentences_to_translate(source_text: str, chunk_result: ChunkMatchResult) -> str:
    """
    Returns only the sentences that still need LLM translation.
    If all sentences matched, returns empty string.
    """
    if not chunk_result.needs_llm:
        return ""
    
    if chunk_result.unmatched_sentences:
        return " ".join(chunk_result.unmatched_sentences)
    
    return source_text  # Fallback: whole segment


def stitch_final_translation(
    source_text: str,
    chunk_result: ChunkMatchResult,
    llm_translation: str
) -> str:
    """
    Merges TM-matched sentence translations with the LLM's partial translation
    to produce the final complete translation.
    """
    if not chunk_result.needs_llm and chunk_result.stitched_translation:
        return chunk_result.stitched_translation
    
    if not chunk_result.sentence_matches:
        return llm_translation
    
    # Build ordered output: TM matches first, then LLM for unmatched
    parts = []
    
    # Get matched sentence translations in order they appeared in source
    sentences = split_into_sentences(source_text)
    matched_by_source = {m["source"]: m["translation"] for m in chunk_result.sentence_matches}
    
    for sentence in sentences:
        if sentence in matched_by_source:
            parts.append(matched_by_source[sentence])
        # Unmatched sentences are covered by the LLM translation appended below
    
    if llm_translation and llm_translation.strip():
        parts.append(llm_translation.strip())
    
    return " ".join(parts)
