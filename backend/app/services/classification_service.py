from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict
from uuid import UUID

from app.models.segment import Segment
from app.services.retrieval_service import retrieve_tm_matches
from app.services.document_service import update_document_status

async def classify_document_segments(
    db: AsyncSession, 
    document_id: str, 
    project_id: str, 
    source_language: str, 
    target_language: str
) -> Dict:
    # Step 1: Fetch pending status ordered by segment_index
    segments_query = await db.execute(
        select(Segment)
        .where(
            Segment.document_id == document_id,
            Segment.status == "pending"
        )
        .order_by(Segment.segment_index)
    )
    segments = segments_query.scalars().all()
    
    if not segments:
        return {
            "document_id": document_id,
            "total_segments": 0,
            "exact_count": 0,
            "fuzzy_count": 0,
            "new_count": 0,
            "auto_approved_count": 0
        }

    exact_count = 0
    fuzzy_count = 0
    new_count = 0

    # Step 2: Classify sequentially
    for segment in segments:
        # Protect against empty texts crashing BM25/Qdrant
        if not segment.source_text or not segment.source_text.strip():
            segment.tm_match_type = "new"
            segment.tm_match_score = 0.0
            segment.status = "pending"
            new_count += 1
            continue

        retrieval_result = await retrieve_tm_matches(
            db=db,
            project_id=UUID(project_id),
            source_language=source_language,
            target_language=target_language,
            source_text=segment.source_text,
            top_k=1 # Just need the best match for classification
        )

        match_type = retrieval_result.get("best_match_type", "new")
        best_match = retrieval_result.get("matches", [])[0] if retrieval_result.get("matches") else None

        if match_type == "exact" and best_match:
            segment.tm_match_type = "exact"
            segment.tm_match_score = best_match.get("score", 1.0)
            segment.translated_text = best_match.get("target_text", "")
            segment.status = "approved"
            exact_count += 1
        elif match_type == "fuzzy" and best_match:
            segment.tm_match_type = "fuzzy"
            segment.tm_match_score = best_match.get("score", 0.0)
            segment.translated_text = best_match.get("target_text", "") # as a suggestion
            segment.status = "pending" 
            fuzzy_count += 1
        else:
            # new
            segment.tm_match_type = "new"
            segment.tm_match_score = 0.0
            segment.status = "pending"
            new_count += 1

    # Step 3: Bulk DB update
    # The session tracks the mapped models, so we just commit to bulk update.
    await update_document_status(db, document_id, "translation_ready") # Optional workflow state marker
    await db.commit()

    # Step 4: Summary Returns
    return {
        "document_id": document_id,
        "total_segments": len(segments),
        "exact_count": exact_count,
        "fuzzy_count": fuzzy_count,
        "new_count": new_count,
        "auto_approved_count": exact_count
    }
