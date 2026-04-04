from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.models.segment import Segment
from app.models.document import Document
from app.models.project import Project
from app.models.audit_log import AuditLog
from app.models.telemetry import TelemetrySignal
from app.services.tm_service import store_tm_entry

async def accept_segment(db: AsyncSession, segment_id: str, target_language: str) -> Segment:
    import logging
    logger = logging.getLogger(__name__)
    
    # Fetch segment and related graph
    seg_query = await db.execute(select(Segment).where(Segment.id == segment_id))
    segment = seg_query.scalars().first()
    
    if not segment:
        raise ValueError("Segment not found")
        
    doc_query = await db.execute(select(Document).where(Document.id == segment.document_id))
    document = doc_query.scalars().first()
    
    proj_query = await db.execute(select(Project).where(Project.id == document.project_id))
    project = proj_query.scalars().first()

    # 1. Update Segment Status
    segment.status = "approved"

    # 2. Audit Log
    audit = AuditLog(
        segment_id=segment.id,
        action="accepted",
        original_text=segment.translated_text
    )
    db.add(audit)

    # 3. Telemetry Signal (desirable format without human_edit)
    telemetry = TelemetrySignal(
        segment_id=segment.id,
        source_text=segment.source_text,
        mt_output=segment.translated_text or "",
        signal_label="desirable"
    )
    db.add(telemetry)

    # Commit the segment status change FIRST so the UI reflects it immediately
    await db.commit()
    await db.refresh(segment)

    # 4. TM Update (non-blocking — don't let Qdrant/embedding errors block the accept)
    if segment.translated_text:
        try:
            await store_tm_entry(
                db=db,
                project_id=project.id,
                source_language=project.source_language,
                target_language=target_language,
                source_text=segment.source_text,
                target_text=segment.translated_text
            )
        except Exception as e:
            logger.warning(f"TM storage failed for segment {segment_id} (non-blocking): {e}")

    return segment

async def edit_segment(db: AsyncSession, segment_id: str, new_translation: str, target_language: str) -> Segment:
    # Fetch segment and related graph
    seg_query = await db.execute(select(Segment).where(Segment.id == segment_id))
    segment = seg_query.scalars().first()
    
    if not segment:
        raise ValueError("Segment not found")
        
    doc_query = await db.execute(select(Document).where(Document.id == segment.document_id))
    document = doc_query.scalars().first()
    
    proj_query = await db.execute(select(Project).where(Project.id == document.project_id))
    project = proj_query.scalars().first()

    old_translation = segment.translated_text or ""

    # 1. Update Segment Status
    segment.status = "approved"
    segment.translated_text = new_translation

    # 2. Audit Log
    audit = AuditLog(
        segment_id=segment.id,
        action="edited",
        original_text=old_translation,
        new_text=new_translation
    )
    db.add(audit)

    # 3. Telemetry Signal (Two Records: Undesirable MT, Desirable Edit)
    if old_translation:
        telemetry_undesirable = TelemetrySignal(
            segment_id=segment.id,
            source_text=segment.source_text,
            mt_output=old_translation,
            human_edit=new_translation,
            signal_label="undesirable"
        )
        db.add(telemetry_undesirable)
        
    telemetry_desirable = TelemetrySignal(
        segment_id=segment.id,
        source_text=segment.source_text,
        mt_output=new_translation,
        human_edit=new_translation, # Some models prefer marking the edit as the intended ideal MT output target
        signal_label="desirable"
    )
    db.add(telemetry_desirable)

    # Commit the segment status change FIRST
    await db.commit()
    await db.refresh(segment)

    # 4. TM Update with corrected translation (non-blocking)
    try:
        await store_tm_entry(
            db=db,
            project_id=project.id,
            source_language=project.source_language,
            target_language=target_language,
            source_text=segment.source_text,
            target_text=new_translation
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"TM storage failed for edited segment {segment_id} (non-blocking): {e}")

    return segment

async def reject_segment(db: AsyncSession, segment_id: str) -> Segment:
    # Fetch segment 
    seg_query = await db.execute(select(Segment).where(Segment.id == segment_id))
    segment = seg_query.scalars().first()
    
    if not segment:
        raise ValueError("Segment not found")

    # 1. Update Segment Status
    segment.status = "rejected"

    # 2. Audit Log
    audit = AuditLog(
        segment_id=segment.id,
        action="rejected",
        original_text=segment.translated_text
    )
    db.add(audit)

    # 3. Telemetry Signal
    if segment.translated_text:
        telemetry_undesirable = TelemetrySignal(
            segment_id=segment.id,
            source_text=segment.source_text,
            mt_output=segment.translated_text,
            signal_label="undesirable"
        )
        db.add(telemetry_undesirable)

    await db.commit()
    await db.refresh(segment)
    return segment

async def get_review_session(db: AsyncSession, document_id: str) -> Dict[str, Any]:
    segments_query = await db.execute(
        select(Segment)
        .where(Segment.document_id == document_id)
        .order_by(Segment.segment_index)
    )
    segments = segments_query.scalars().all()
    
    # Fetch document and project to get target_language
    doc_query = await db.execute(select(Document).where(Document.id == document_id))
    document = doc_query.scalars().first()
    
    target_language = None
    if document:
        proj_query = await db.execute(select(Project).where(Project.id == document.project_id))
        project = proj_query.scalars().first()
        if project:
            target_language = project.target_language
    
    total = len(segments)
    approved_count = sum(1 for s in segments if s.status == "approved")
    pending_count = sum(1 for s in segments if s.status == "pending")
    rejected_count = sum(1 for s in segments if s.status == "rejected")
    completion_percentage = (approved_count / total * 100) if total > 0 else 0.0
    
    return {
        "document_id": document_id,
        "total": total,
        "approved_count": approved_count,
        "pending_count": pending_count,
        "rejected_count": rejected_count,
        "completion_percentage": round(completion_percentage, 2),
        "target_language": target_language,
        "segments": segments
    }
