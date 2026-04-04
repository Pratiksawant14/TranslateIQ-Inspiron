import re
import json
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from anthropic import AsyncAnthropic

from app.models.segment import Segment
from app.models.validation_issue import ValidationIssue
from app.config import settings
from app.services import document_service

logger = logging.getLogger(__name__)

async def validate_document(db: AsyncSession, document_id: str) -> dict:
    # Step 1: Load segments
    segments_query = await db.execute(
        select(Segment)
        .where(Segment.document_id == document_id)
        .order_by(Segment.segment_index)
    )
    segments = segments_query.scalars().all()
    
    if not segments:
        await document_service.update_document_status(db, document_id, "translating")
        return {
            "document_id": document_id,
            "total_issues": 0,
            "issues_by_severity": {"low": 0, "medium": 0, "high": 0},
            "issues": []
        }

    # Pre-calculate document-level statistics for consistency checks
    paragraphs = [s for s in segments if s.content_type == "paragraph" and s.source_text]
    total_paragraphs = len(paragraphs)
    paragraphs_with_period = sum(1 for s in paragraphs if s.source_text.strip().endswith('.'))
    expects_trailing_period = total_paragraphs > 0 and (paragraphs_with_period / total_paragraphs > 0.3)
    
    # Regexes for format inconsistency detection
    us_date_regex = re.compile(r'\b\d{1,2}/\d{1,2}/\d{4}\b')
    eu_date_regex = re.compile(r'\b\d{1,2}-\d{1,2}-\d{4}\b')
    has_us_date = any(us_date_regex.search(s.source_text) for s in segments if s.source_text)
    has_eu_date = any(eu_date_regex.search(s.source_text) for s in segments if s.source_text)
    mixed_dates = has_us_date and has_eu_date
    
    us_num_regex = re.compile(r'\b\d{1,3}(?:,\d{3})+\.\d+\b')
    eu_num_regex = re.compile(r'\b\d{1,3}(?:\.\d{3})+,[0-9]+\b')
    has_us_num = any(us_num_regex.search(s.source_text) for s in segments if s.source_text)
    has_eu_num = any(eu_num_regex.search(s.source_text) for s in segments if s.source_text)
    mixed_numbers = has_us_num and has_eu_num
    
    allowed_caps = {"USA", "ID", "PDF", "API", "URL", "LLM", "UI", "DB", "UUID", "JSON"}
    issues_to_create = []
    
    # Step 2: Rule-based Checks
    for s in segments:
        text = s.source_text
        if not text:
            continue

        # Double spaces
        if "  " in text:
            issues_to_create.append(ValidationIssue(
                document_id=document_id, segment_id=s.id, issue_type="formatting", 
                severity="low", description="Double spaces detected in text.", original_text=text
            ))
            
        # Punctuation inconsistency
        if s.content_type == "paragraph" and expects_trailing_period:
            if not text.strip().endswith('.'):
                issues_to_create.append(ValidationIssue(
                    document_id=document_id, segment_id=s.id, issue_type="punctuation", 
                    severity="low", description="Missing trailing period in paragraph.", original_text=text
                ))
                
        # Mixed Date Formats
        if mixed_dates:
            if us_date_regex.search(text) or eu_date_regex.search(text):
                issues_to_create.append(ValidationIssue(
                    document_id=document_id, segment_id=s.id, issue_type="formatting", 
                    severity="medium", description="Document contains mixed date formats (MM/DD/YYYY vs DD-MM-YYYY).", original_text=text
                ))
                
        # All-caps words overflow
        words = re.findall(r'\b\w+\b', text)
        all_caps_words = [w for w in words if w.isupper() and len(w) > 1 and not any(char.isdigit() for char in w) and w not in allowed_caps]
        if len(all_caps_words) > 2:
            issues_to_create.append(ValidationIssue(
                document_id=document_id, segment_id=s.id, issue_type="formatting", 
                severity="low", description=f"Contains unusual all-caps words: {', '.join(all_caps_words[:3])}...", original_text=text
            ))
            
        # Mixed Number Formats
        if mixed_numbers:
            if us_num_regex.search(text) or eu_num_regex.search(text):
                issues_to_create.append(ValidationIssue(
                    document_id=document_id, segment_id=s.id, issue_type="formatting", 
                    severity="medium", description="Document contains mixed number formats (comma vs period decimals).", original_text=text
                ))

    # Step 3: LLM terminology check (1 call for whole doc)
    try:
        # Build prompt from indexed segment texts
        prompt = "Analyze the following document segments and identify terminology inconsistencies where the same concept is referred to by different names. Return your analysis EXACTLY as a JSON array of objects. Each object should have 'term_variations' (list of strings), 'affected_segments' (list of segment integers), and 'suggested_standard' (string). Return ONLY raw JSON without markdown blocks.\n\nSegments:\n"
        for s in segments:
            if s.source_text:
                prompt += f"[{s.segment_index}] {s.source_text}\n"
                
        api_key = settings.OPENROUTER_API_KEY
        if api_key and api_key.strip():
            client = AsyncAnthropic(
                api_key=api_key,
                base_url=settings.OPENROUTER_BASE_URL,
            )
            response = await client.messages.create(
                model="anthropic/claude-3.5-sonnet",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            raw_json = response.content[0].text.strip()
            # Clean markdown codeblocks
            if raw_json.startswith("```"):
                raw_json = re.sub(r"^```(?:json)?\n?|```$", "", raw_json, flags=re.MULTILINE).strip()
                
            variations = json.loads(raw_json)
            
            # Map LLM results cleanly into ValidationIssue instances
            for var in variations:
                affected = var.get("affected_segments", [])
                
                seg_id = None
                original_txt = None
                if affected:
                    for s in segments:
                        if s.segment_index == affected[0]:
                            seg_id = s.id
                            original_txt = s.source_text
                            break

                desc = f"Terminology variation detected: {', '.join(var.get('term_variations', []))}. Consider standardizing to: {var.get('suggested_standard', '')}"
                
                issues_to_create.append(ValidationIssue(
                    document_id=document_id,
                    segment_id=seg_id,
                    issue_type="terminology",
                    severity="high",
                    description=desc,
                    suggested_fix=var.get("suggested_standard", ""),
                    original_text=original_txt
                ))
    except Exception as e:
        logger.error(f"Claude terminology check failed: {e}")
        # Soft fail, don't break validation workflow

    # Step 4: Save issues and update document status
    if issues_to_create:
        db.add_all(issues_to_create)
    
    await document_service.update_document_status(db, document_id, "translating")
    await db.commit()

    # If new records exist, we need to refresh them to fetch their created IDs
    for issue in issues_to_create:
        await db.refresh(issue)
        
    # Format and Return stats
    low = sum(1 for i in issues_to_create if i.severity == "low")
    medium = sum(1 for i in issues_to_create if i.severity == "medium")
    high = sum(1 for i in issues_to_create if i.severity == "high")
    
    return {
        "document_id": document_id,
        "total_issues": len(issues_to_create),
        "issues_by_severity": {"low": low, "medium": medium, "high": high},
        "issues": issues_to_create
    }
