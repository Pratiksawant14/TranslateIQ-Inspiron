from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
import os

from app.database import get_db
from app.config import settings
from app.services import parse_service, document_service, project_service
from app.services import classification_service, translation_service
from app.schemas.document import DocumentResponse, ParseResponse, ClassificationRequest, ClassificationResponse, TranslationRequest, TranslationResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
UPLOAD_DIR = settings.UPLOAD_DIR

# Ensure uploads directory exists at project root
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/{project_id}/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    project_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await project_service.get_project_by_id(db, project_id)

    # Validate extension
    filename = file.filename or "unnamed_file"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Clean extension for file_type ('pdf' or 'docx', strip the dot)
    file_type = ext.lstrip('.')
    
    # Insert document to DB to get its UUID
    document = await document_service.create_document(db, project_id, filename, file_type)

    # Save physical file using the document UUID as filename
    file_path = os.path.join(UPLOAD_DIR, f"{str(document.id)}{ext}")
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        # Update the document status to error if saving the file failed
        await document_service.update_document_status(db, document.id, "error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save file")
        
    return document

@router.get("/{project_id}/documents", response_model=List[DocumentResponse])
async def get_documents(project_id: UUID, db: AsyncSession = Depends(get_db)):
    # Verify project exists
    await project_service.get_project_by_id(db, project_id)
    return await document_service.get_documents_by_project(db, project_id)

@router.post("/{project_id}/documents/{document_id}/parse", response_model=ParseResponse)
async def parse_document_endpoint(
    project_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await project_service.get_project_by_id(db, project_id)
    
    # Process file and return result dict which seamlessly aligns with ParseResponse
    return await parse_service.parse_document(db, document_id)

@router.post("/{project_id}/documents/{document_id}/classify", response_model=ClassificationResponse)
async def classify_document_endpoint(
    project_id: UUID,
    document_id: UUID,
    request: ClassificationRequest,
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await project_service.get_project_by_id(db, project_id)
    
    # Run classification
    return await classification_service.classify_document_segments(
        db=db,
        document_id=str(document_id),
        project_id=str(project_id),
        source_language=request.source_language,
        target_language=request.target_language
    )

@router.post("/{project_id}/documents/{document_id}/translate", response_model=TranslationResponse)
async def translate_document_endpoint(
    project_id: UUID,
    document_id: UUID,
    request: TranslationRequest,
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await project_service.get_project_by_id(db, project_id)
    
    # Run LLM translation
    return await translation_service.translate_document_segments(
        db=db,
        document_id=str(document_id),
        project_id=str(project_id),
        source_language=request.source_language,
        target_language=request.target_language,
        style_profile_id=str(request.style_profile_id) if request.style_profile_id else None
    )

@router.delete("/{project_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_endpoint(
    project_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import delete, select
    from app.models.document import Document
    from app.models.segment import Segment
    from app.models.audit_log import AuditLog
    from app.models.telemetry import TelemetrySignal
    
    await project_service.get_project_by_id(db, project_id)
    doc = await db.scalar(select(Document).where(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    segment_query = select(Segment.id).where(Segment.document_id == str(document_id))
    
    await db.execute(delete(TelemetrySignal).where(TelemetrySignal.segment_id.in_(segment_query)))
    await db.execute(delete(AuditLog).where(AuditLog.segment_id.in_(segment_query)))
    await db.execute(delete(Segment).where(Segment.document_id == str(document_id)))
    await db.execute(delete(Document).where(Document.id == document_id))
    await db.commit()
    
    return None
