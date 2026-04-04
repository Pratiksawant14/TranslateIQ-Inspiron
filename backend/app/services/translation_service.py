import json
import logging
import re
import uuid
from typing import Dict, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import httpx

from app.config import settings
from app.models.segment import Segment
from app.models.glossary import GlossaryEntry
from app.models.style_profile import StyleProfile
from app.services.retrieval_service import retrieve_tm_matches
from app.services.document_service import update_document_status

logger = logging.getLogger(__name__)

async def translate_document_segments(
    db: AsyncSession,
    document_id: str,
    project_id: str,
    source_language: str,
    target_language: str,
    style_profile_id: Optional[str] = None
) -> Dict[str, Any]:
    
    # 1. Fetch all segments for the document (the loop skips already-translated ones)
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

    # Formatting blocks for Prompt
    glossary_text = ""
    if glossary_entries:
        glossary_text = "GLOSSARY — you MUST use these terms. Adapt grammatical form naturally:\n"
        for idx, entry in enumerate(glossary_entries, 1):
            glossary_text += f"{idx}. {entry.source_term} -> {entry.target_term}\n"

    translated_count = 0
    skipped_count = 0
    
    if not segments:
        return {
            "document_id": document_id,
            "translated_count": 0,
            "skipped_count": 0,
            "target_language": target_language
        }

    api_key = settings.OPENROUTER_API_KEY or settings.ANTHROPIC_API_KEY
    if not api_key:
        logger.error("API key is missing. Set OPENROUTER_API_KEY in .env")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Translation service unavailable: API Key missing."
        )

    logger.info(f"=== TRANSLATION START === Key: {api_key[:12]}... | Segments: {len(segments)} | Lang: {source_language}->{target_language}")

    # OpenRouter API headers
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://translate-iq.com",
        "X-Title": "TranslateIQ"
    }

    async with httpx.AsyncClient(timeout=120.0) as http_client:
        for idx, segment in enumerate(segments):
            logger.info(f"--- Segment {idx+1}/{len(segments)} (id={segment.id}) ---")

            if not segment.source_text or not segment.source_text.strip():
                segment.translated_text = ""
                translated_count += 1
                logger.info(f"  Skipped: empty source text")
                continue

            # Fetch top 2 TM fuzzy matches
            tm_examples = ""
            best_tm_score = 0.0
            has_tm_context = False
            try:
                retrieval_res = await retrieve_tm_matches(
                    db=db, project_id=uuid.UUID(project_id), source_language=source_language,
                    target_language=target_language, source_text=segment.source_text, top_k=2
                )
                matches = retrieval_res.get("matches", [])
                if matches:
                    has_tm_context = True
                    best_tm_score = matches[0].get("score", 0.0)
                    tm_examples = "TRANSLATION MEMORY EXAMPLES (Reference These):\n"
                    for i, m in enumerate(matches, 1):
                        tm_examples += f"- Source: {m.get('source_text')}\n- Target: {m.get('target_text')}\n"
            except Exception as e:
                logger.warning(f"  TM match fetch failed: {e}")

            # Construct prompts
            sys_instructions = f"You are a professional translator. Translate the source text from {source_language} to {target_language}.\n\nTONE: {tone}\nSTYLE RULES: {custom_rules}\n\n{glossary_text}\n{tm_examples}"

            prompt = f"SOURCE TEXT:\n{segment.source_text}\n\nRespond ONLY with a JSON object in this exact format:\n{{\"translation\": \"your translated text here\", \"glossary_terms_used\": [], \"notes\": \"\"}}"

            try:
                payload = {
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": sys_instructions},
                        {"role": "user", "content": prompt}
                    ]
                }

                logger.info(f"  Calling OpenRouter (gpt-4o-mini) for: '{segment.source_text[:60]}...'")

                resp = await http_client.post(
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    json=payload,
                    headers=headers
                )

                logger.info(f"  Response status: {resp.status_code}")

                if resp.status_code != 200:
                    logger.error(f"  OpenRouter Error {resp.status_code}: {resp.text[:300]}")
                    skipped_count += 1
                    segment.status = "error"
                    continue

                res_json = resp.json()
                raw_text = res_json["choices"][0]["message"]["content"].strip()
                logger.info(f"  Raw LLM response: {raw_text[:200]}")

                # Strip markdown code fences if present
                if raw_text.startswith("```"):
                    raw_text = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()

                try:
                    result_json = json.loads(raw_text)
                    translated_text = result_json.get("translation", raw_text)
                except json.JSONDecodeError:
                    logger.warning(f"  JSON parse failed, using raw text as translation")
                    translated_text = raw_text

                if isinstance(translated_text, dict):
                    translated_text = str(translated_text)

                segment.translated_text = translated_text

                # Derive initial confidence from TM context availability
                # TM-backed translations get a boost proportional to match quality
                if has_tm_context and best_tm_score > 0:
                    # Scale: strong fuzzy match (0.95) → 0.92 confidence, weaker match (0.75) → 0.78
                    segment.confidence_score = round(0.5 + (best_tm_score * 0.45), 2)
                else:
                    # Pure LLM translation with no TM backing — lower initial confidence
                    segment.confidence_score = 0.65

                segment.status = "pending"
                translated_count += 1
                logger.info(f"  ✓ Translated (conf={segment.confidence_score}): '{translated_text[:80]}...'")

            except Exception as e:
                logger.error(f"  ✗ Failed to translate segment {segment.id}: {e}", exc_info=True)
                segment.status = "error"
                skipped_count += 1

    logger.info(f"=== TRANSLATION DONE === Translated: {translated_count} | Skipped: {skipped_count}")

    # 5. Bulk commit operation
    # Mark the document ready for final UI review
    await update_document_status(db, document_id, "translated")
    await db.commit()

    return {
        "document_id": document_id,
        "translated_count": translated_count,
        "skipped_count": skipped_count,
        "target_language": target_language
    }
