from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services import project_service

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    return await project_service.create_project(db, project_data)

@router.get("/", response_model=List[ProjectResponse])
async def get_all_projects(db: AsyncSession = Depends(get_db)):
    return await project_service.get_all_projects(db)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    return await project_service.get_project_by_id(db, project_id)
