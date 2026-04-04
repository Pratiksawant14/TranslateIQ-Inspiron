from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.database import get_db
from app.models.document import Document
from app.models.segment import Segment
from app.models.translation_memory import TranslationMemory
from app.models.telemetry import TelemetrySignal
from app.schemas.analytics import ProjectAnalyticsResponse
from app.services.project_service import get_project_by_id

router = APIRouter()

@router.get("/{project_id}/analytics", response_model=ProjectAnalyticsResponse)
async def get_project_analytics(
    project_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)

    # Get all document IDs for this project
    doc_result = await db.execute(
        select(Document.id).where(Document.project_id == project_id)
    )
    doc_ids = [row[0] for row in doc_result.all()]

    if not doc_ids:
        return ProjectAnalyticsResponse(
            project_id=project_id,
            total_segments=0, approved_count=0,
            exact_matches=0, fuzzy_matches=0, new_segments=0,
            tm_entries_count=0, telemetry_count=0,
            avg_confidence=None, completion_percentage=0.0,
        )

    # Segment stats
    seg_result = await db.execute(
        select(
            func.count(Segment.id).label("total"),
            func.count(Segment.id).filter(Segment.status == "approved").label("approved"),
            func.count(Segment.id).filter(Segment.tm_match_type == "exact").label("exact"),
            func.count(Segment.id).filter(Segment.tm_match_type == "fuzzy").label("fuzzy"),
            func.count(Segment.id).filter(Segment.tm_match_type == "new").label("new_seg"),
            func.avg(Segment.confidence_score).label("avg_conf"),
        ).where(Segment.document_id.in_(doc_ids))
    )
    row = seg_result.one()
    total = row.total or 0
    approved = row.approved or 0
    exact = row.exact or 0
    fuzzy = row.fuzzy or 0
    new_seg = row.new_seg or 0
    avg_conf = round(float(row.avg_conf), 4) if row.avg_conf else None

    # TM count
    tm_result = await db.execute(
        select(func.count(TranslationMemory.id)).where(TranslationMemory.project_id == project_id)
    )
    tm_count = tm_result.scalar() or 0

    # Telemetry count — join through segments
    tele_result = await db.execute(
        select(func.count(TelemetrySignal.id)).where(
            TelemetrySignal.segment_id.in_(
                select(Segment.id).where(Segment.document_id.in_(doc_ids))
            )
        )
    )
    tele_count = tele_result.scalar() or 0

    completion = (approved / total * 100) if total > 0 else 0.0

    return ProjectAnalyticsResponse(
        project_id=project_id,
        total_segments=total,
        approved_count=approved,
        exact_matches=exact,
        fuzzy_matches=fuzzy,
        new_segments=new_seg,
        tm_entries_count=tm_count,
        telemetry_count=tele_count,
        avg_confidence=avg_conf,
        completion_percentage=round(completion, 2),
    )
