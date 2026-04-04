from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.schemas.review import MTQEScoreResponse, ReviewSessionResponse, ReviewSegmentResponse, EditSegmentRequest
from app.services import mtqe_service, review_service
from app.services.project_service import get_project_by_id

router = APIRouter()

@router.post("/projects/{project_id}/documents/{document_id}/score", response_model=MTQEScoreResponse)
async def score_document(
    project_id: UUID,
    document_id: UUID,
    target_language: str,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    return await mtqe_service.score_document_segments(
        db, 
        str(document_id), 
        str(project_id), 
        target_language
    )

@router.get("/projects/{project_id}/documents/{document_id}/review", response_model=ReviewSessionResponse)
async def get_review_session(
    project_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    return await review_service.get_review_session(db, str(document_id))

@router.post("/segments/{segment_id}/accept", response_model=ReviewSegmentResponse)
async def accept_segment(
    segment_id: UUID,
    target_language: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await review_service.accept_segment(db, str(segment_id), target_language)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/segments/{segment_id}/edit", response_model=ReviewSegmentResponse)
async def edit_segment(
    segment_id: UUID,
    request: EditSegmentRequest,
    target_language: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await review_service.edit_segment(
            db=db, 
            segment_id=str(segment_id), 
            new_translation=request.new_translation, 
            target_language=target_language
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/segments/{segment_id}/reject", response_model=ReviewSegmentResponse)
async def reject_segment(
    segment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await review_service.reject_segment(db, str(segment_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
