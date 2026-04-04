from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.schemas.tm import TMBulkCreate, TMEntryResponse, TMSearchRequest, TMSearchResponse
from app.services import tm_service
from app.services.project_service import get_project_by_id
from app.models.translation_memory import TranslationMemory

router = APIRouter()

@router.post("/{project_id}/tm/seed", status_code=status.HTTP_201_CREATED)
async def seed_tm(
    project_id: UUID,
    payload: TMBulkCreate,
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await get_project_by_id(db, project_id)

    entries_dicts = []
    for entry in payload.entries:
        if entry.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Entry project_id {entry.project_id} does not match URL project_id {project_id}"
            )
        entries_dicts.append(entry.model_dump())

    count = await tm_service.bulk_store_tm_entries(db, entries_dicts)
    return {"stored": count}

@router.get("/{project_id}/tm", response_model=List[TMEntryResponse])
async def get_tm_entries(
    project_id: UUID, 
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await get_project_by_id(db, project_id)
    
    # Retrieve all entries for project
    result = await db.execute(
        select(TranslationMemory)
        .filter(TranslationMemory.project_id == project_id)
        .order_by(TranslationMemory.created_at.desc())
    )
    return list(result.scalars().all())

@router.post("/{project_id}/tm/search", response_model=TMSearchResponse)
async def search_tm(
    project_id: UUID,
    payload: TMSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    await get_project_by_id(db, project_id)

    # Note: retrieval_service imports are imported inline or globally to ensure resolving
    from app.services import retrieval_service
    return await retrieval_service.retrieve_tm_matches(
        db=db,
        project_id=project_id,
        source_language=payload.source_language,
        target_language=payload.target_language,
        source_text=payload.source_text,
        top_k=payload.top_k
    )
