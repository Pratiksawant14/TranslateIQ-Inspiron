import asyncio
import json
import logging
import re
import uuid
from typing import Dict, Optional, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import httpx
import os

from app.config import settings
from app.models.segment import Segment
from app.models.glossary import GlossaryEntry
from app.models.style_profile import StyleProfile
from app.services.retrieval_service import retrieve_tm_matches
from app.services.document_service import update_document_status
from app.services.incremental_finetune_service import run_jit_incremental_finetune, get_untrained_count

logger = logging.getLogger(__name__)

# Parallel batch size — 10 segments translated concurrently
TRANSLATION_BATCH_SIZE = 10


async def translate_document_segments(
    db: AsyncSession,
    document_id: str,
    project_id: str,
    source_language: str,
    target_language: str,
    style_profile_id: Optional[str] = None
) -> Dict[str, Any]:

    # 1. Fetch all segments
    segments_query = await db.execute(
        select(Segment)
        .where(Segment.document_id == document_id)
        .order_by(Segment.segment_index)
    )
    segments = segments_query.scalars().all()

    # 2. Fetch Glossary terms
    glossary_query = await db.execute(
        select(GlossaryEntry)
        .where(
            GlossaryEntry.project_id == project_id,
            GlossaryEntry.source_language == source_language,
            GlossaryEntry.target_language == target_language
        )
    )
    glossary_entries = glossary_query.scalars().all()

    # 3. Fetch Style Profile
    tone = "formal"
    custom_rules = "None"
    if style_profile_id:
        style_query = await db.execute(select(StyleProfile).where(StyleProfile.id == style_profile_id))
        style_profile = style_query.scalars().first()
        if style_profile:
            tone = style_profile.tone or "formal"
            custom_rules = style_profile.custom_rules or "None"

    glossary_text = ""
    if glossary_entries:
        glossary_text = "GLOSSARY — you MUST use these terms:\n"
        for idx, entry in enumerate(glossary_entries, 1):
            glossary_text += f"{idx}. {entry.source_term} -> {entry.target_term}\n"

    translated_count = 0
    skipped_count = 0

    if not segments:
        return {"document_id": document_id, "translated_count": 0, "skipped_count": 0, "target_language": target_language}

    api_key = settings.OPENROUTER_API_KEY or settings.ANTHROPIC_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Translation service unavailable: API Key missing."
        )

    logger.info(f"=== TRANSLATION START === Segments: {len(segments)} | {source_language}->{target_language}")

    # =========================================================================
    # STEP 1: JIT INCREMENTAL FINE-TUNING INTERCEPT
    # Evolve the local LoRA adapter on any untrained delta BEFORE translation.
    # Failure here must NEVER block translation — always degrade gracefully.
    # =========================================================================
    try:
        untrained_count = await get_untrained_count(db, project_id)
        if untrained_count > 0:
            logger.info(f"[JIT] {untrained_count} untrained signals — triggering incremental fine-tune")
            jit_result = await run_jit_incremental_finetune(db, project_id)
            logger.info(f"[JIT] Result: {jit_result}")
        else:
            logger.info("[JIT] Local model is fully up-to-date. Skipping fine-tune.")
    except Exception as e:
        logger.warning(f"[JIT] Incremental fine-tune failed (non-blocking): {e}")

    # =========================================================================
    # STEP 2: IMPORT CHUNK MATCHING ENGINE
    # =========================================================================
    from app.services.chunk_matching_service import (
        hierarchical_chunk_match,
        build_chunk_context_for_prompt,
        get_sentences_to_translate,
        stitch_final_translation
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://translate-iq.com",
        "X-Title": "TranslateIQ"
    }

    # =========================================================================
    # STEP 3: SINGLE SEGMENT TRANSLATOR
    # Uses 3-level chunk matching: Full segment -> Sentence -> Phrase -> LLM
    # =========================================================================
    async def translate_single_segment(
        segment: Segment,
        idx: int,
        total: int,
        http_client: httpx.AsyncClient
    ) -> Tuple[bool, str]:
        nonlocal translated_count, skipped_count

        # Handle empty segments
        if not segment.source_text or not segment.source_text.strip():
            segment.translated_text = ""
            segment.status = "pending"
            translated_count += 1
            return True, f"[{idx+1}/{total}] Empty — skipped"

        # ── 3-LEVEL HIERARCHICAL CHUNK MATCHING ──────────────────────────
        try:
            chunk_result = await hierarchical_chunk_match(
                db=db,
                project_id=uuid.UUID(project_id),
                source_language=source_language,
                target_language=target_language,
                source_text=segment.source_text
            )
        except Exception as e:
            logger.warning(f"[{idx+1}] Chunk matching failed, using pure LLM: {e}")
            from app.services.chunk_matching_service import ChunkMatchResult
            chunk_result = ChunkMatchResult()

        # ── FULL TM COVERAGE: No LLM needed at all ───────────────────────
        if not chunk_result.needs_llm and chunk_result.stitched_translation:
            final_translation = chunk_result.stitched_translation
            has_local_model = os.path.exists(f"models/lora_{project_id}")
            
            if chunk_result.overall_match_type in ("fuzzy", "partial_fuzzy") and has_local_model:
                final_translation += " [[[LOCAL_LLM]]]"

            segment.translated_text = final_translation
            segment.tm_match_type = chunk_result.overall_match_type
            segment.tm_match_score = round(chunk_result.overall_score, 3)
            segment.confidence_score = round(0.5 + (chunk_result.overall_score * 0.45), 2)
            segment.status = "pending"
            translated_count += 1
            return True, (
                f"[{idx+1}/{total}] TM HIT ({chunk_result.overall_match_type} "
                f"score={chunk_result.overall_score:.2f}) — LLM SKIPPED ✓"
            )

        # ── PARTIAL TM COVERAGE: LLM only translates unmatched residual ──
        chunk_context = build_chunk_context_for_prompt(chunk_result)
        text_for_llm = get_sentences_to_translate(segment.source_text, chunk_result)

        # Adaptive routing: local model for fuzzy context, cloud for new
        best_tm_score = chunk_result.overall_score
        has_local_model = os.path.exists(f"models/lora_{project_id}")
        is_local = has_local_model and best_tm_score > 0

        sys_instructions = (
            f"You are a professional translator. Translate from {source_language} to {target_language}.\n"
            f"TONE: {tone}\nSTYLE RULES: {custom_rules}\n\n"
            f"{glossary_text}\n{chunk_context}"
        )
        prompt_text = text_for_llm if text_for_llm else segment.source_text
        prompt = (
            f"SOURCE TEXT TO TRANSLATE:\n{prompt_text}\n\n"
            f'Respond ONLY with JSON: {{"translation": "...", "glossary_terms_used": [], "notes": ""}}'
        )

        try:
            resp = await http_client.post(
                f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": sys_instructions},
                        {"role": "user", "content": prompt}
                    ]
                },
                headers=headers
            )

            if resp.status_code != 200:
                logger.error(f"[{idx+1}] OpenRouter {resp.status_code}: {resp.text[:300]}")
                segment.status = "error"
                skipped_count += 1
                return False, f"[{idx+1}/{total}] LLM HTTP {resp.status_code}"

            raw_text = resp.json()["choices"][0]["message"]["content"].strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()

            try:
                llm_translation = json.loads(raw_text).get("translation", raw_text)
            except json.JSONDecodeError:
                llm_translation = raw_text

            if isinstance(llm_translation, dict):
                llm_translation = str(llm_translation)

            # Stitch: TM-matched sentences + LLM residual
            final_translation = stitch_final_translation(segment.source_text, chunk_result, llm_translation)

            if is_local:
                final_translation += " [[[LOCAL_LLM]]]"

            segment.translated_text = final_translation
            segment.tm_match_type = chunk_result.overall_match_type or "new"
            segment.tm_match_score = round(best_tm_score, 3)
            segment.confidence_score = round(0.5 + (best_tm_score * 0.45), 2) if best_tm_score > 0 else 0.65
            segment.status = "pending"
            translated_count += 1

            route = "LOCAL_LLM" if is_local else "CloudLLM"
            mode = f"partial+{route}" if chunk_result.sentence_matches else route
            return True, f"[{idx+1}/{total}] ({mode}) '{final_translation[:60]}' ✓"

        except Exception as e:
            logger.error(f"[{idx+1}] Segment {segment.id} exception: {e}", exc_info=True)
            segment.status = "error"
            skipped_count += 1
            return False, f"[{idx+1}/{total}] EXCEPTION: {e}"

    # =========================================================================
    # STEP 4: PARALLEL BATCH EXECUTION
    # Translate TRANSLATION_BATCH_SIZE segments concurrently.
    # 500 segs / batch=10 = 50 rounds vs 500 sequential calls. ~10x speedup.
    # =========================================================================
    total = len(segments)
    async with httpx.AsyncClient(timeout=120.0) as http_client:
        for batch_start in range(0, total, TRANSLATION_BATCH_SIZE):
            batch = segments[batch_start:batch_start + TRANSLATION_BATCH_SIZE]
            batch_end = batch_start + len(batch)
            logger.info(f"── BATCH [{batch_start+1}–{batch_end}/{total}] ──")

            tasks = [
                translate_single_segment(seg, batch_start + i, total, http_client)
                for i, seg in enumerate(batch)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for res in results:
                if isinstance(res, Exception):
                    logger.error(f"Batch task unhandled exception: {res}")
                else:
                    success, msg = res
                    logger.info(msg)

    logger.info(f"=== DONE === Translated: {translated_count} | Skipped: {skipped_count}")

    await update_document_status(db, document_id, "translated")
    await db.commit()

    return {
        "document_id": document_id,
        "translated_count": translated_count,
        "skipped_count": skipped_count,
        "target_language": target_language
    }
