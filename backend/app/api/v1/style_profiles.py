from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.style_profile import StyleProfile
from app.schemas.style_profile import StyleProfileCreate, StyleProfileResponse
from app.services.project_service import get_project_by_id

router = APIRouter()

@router.post("/{project_id}/style-profiles", response_model=StyleProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_style_profile(
    project_id: UUID,
    profile: StyleProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    db_profile = StyleProfile(
        project_id=project_id,
        name=profile.name,
        tone=profile.tone,
        custom_rules=profile.custom_rules,
        target_language=profile.target_language,
    )
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile

@router.get("/{project_id}/style-profiles", response_model=List[StyleProfileResponse])
async def get_style_profiles(
    project_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    result = await db.execute(
        select(StyleProfile).where(StyleProfile.project_id == project_id).order_by(StyleProfile.created_at.desc())
    )
    return result.scalars().all()

@router.delete("/{project_id}/style-profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_style_profile(
    project_id: UUID,
    profile_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    result = await db.execute(
        select(StyleProfile).where(StyleProfile.id == profile_id, StyleProfile.project_id == project_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Style profile not found")
    
    await db.delete(profile)
    await db.commit()
