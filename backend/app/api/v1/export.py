import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.services.export_service import export_document_docx
from app.models.segment import Segment
from app.models.document import Document
from app.schemas.export import ExportStatusResponse

router = APIRouter()

@router.get("/projects/{project_id}/documents/{document_id}/export/status", response_model=ExportStatusResponse)
async def get_export_status(
    project_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    doc_query = await db.execute(select(Document).where(Document.id == document_id, Document.project_id == project_id))
    document = doc_query.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    segments_query = await db.execute(select(Segment).where(Segment.document_id == document_id))
    segments = segments_query.scalars().all()
    
    total = len(segments)
    approved_count = sum(1 for s in segments if s.status in ["approved", "edited"])
    
    completion_percentage = (approved_count / total * 100) if total > 0 else 0.0
    ready_to_export = approved_count > 0
    
    return ExportStatusResponse(
        document_id=str(document_id),
        approved_count=approved_count,
        total_segments=total,
        ready_to_export=ready_to_export,
        completion_percentage=round(completion_percentage, 2)
    )

@router.post("/projects/{project_id}/documents/{document_id}/export")
async def export_document(
    project_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    # Verify doc exists and belongs to project
    doc_query = await db.execute(select(Document).where(Document.id == document_id, Document.project_id == project_id))
    document = doc_query.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # generate doc
    filepath = await export_document_docx(db, str(document_id))
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate document")
        
    filename = os.path.basename(filepath)
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
