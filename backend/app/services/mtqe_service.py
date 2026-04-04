from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.segment import Segment
from app.models.glossary import GlossaryEntry

def score_segment(source_text: str, translated_text: str, glossary_terms: List[GlossaryEntry]) -> float:
    score_glossary = 1.0
    
    # 1. Glossary compliance (40% weight)
    if glossary_terms:
        # Filter terms that actually appear in the source text
        applicable_terms = [t for t in glossary_terms if t.source_term.lower() in source_text.lower()]
        
        if applicable_terms:
            found_count = 0
            for term in applicable_terms:
                if term.target_term.lower() in translated_text.lower():
                    found_count += 1
            score_glossary = found_count / len(applicable_terms)

    # 2. Length ratio check (30% weight)
    score_length = 0.5
    src_len = len(source_text.strip())
    tgt_len = len(translated_text.strip())
    
    if src_len > 0:
        ratio = tgt_len / src_len
        if 0.5 <= ratio <= 2.0:
            score_length = 1.0
    elif tgt_len == 0:
        score_length = 1.0 # both empty = acceptable length match (though non-empty catches it)

    # 3. Non-empty check (30% weight)
    score_empty = 1.0 if translated_text.strip() else 0.0

    final_score = (score_glossary * 0.40) + (score_length * 0.30) + (score_empty * 0.30)
    return round(final_score, 2)

async def score_document_segments(db: AsyncSession, document_id: str, project_id: str, target_language: str) -> Dict[str, Any]:
    # Fetch all newly translated segments
    segments_query = await db.execute(
        select(Segment)
        .where(
            Segment.document_id == document_id,
            Segment.tm_match_type == "new",
            Segment.translated_text != None
        )
    )
    segments = segments_query.scalars().all()

    # Fetch glossary
    glossary_query = await db.execute(
        select(GlossaryEntry)
        .where(
            GlossaryEntry.project_id == project_id,
            GlossaryEntry.target_language == target_language
        )
    )
    glossary_entries = glossary_query.scalars().all()

    scored_count = 0
    total_confidence = 0.0
    review_needed_count = 0

    for segment in segments:
        new_score = score_segment(
            source_text=segment.source_text or "",
            translated_text=segment.translated_text or "",
            glossary_terms=glossary_entries
        )
        
        segment.confidence_score = new_score
        scored_count += 1
        total_confidence += new_score
        
        if new_score < 0.85:
            review_needed_count += 1

    if scored_count > 0:
        await db.commit()

    average_confidence = total_confidence / scored_count if scored_count > 0 else 0.0

    return {
        "document_id": document_id,
        "scored_count": scored_count,
        "average_confidence": round(average_confidence, 2),
        "segments_needing_review": review_needed_count
    }
