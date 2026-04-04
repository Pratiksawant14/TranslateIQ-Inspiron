from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from typing import List
from uuid import UUID

from app.models.project import Project
from app.schemas.project import ProjectCreate

async def create_project(db: AsyncSession, data: ProjectCreate) -> Project:
    db_project = Project(
        name=data.name,
        description=data.description,
        source_language=data.source_language
    )
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

async def get_all_projects(db: AsyncSession) -> List[Project]:
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    return list(result.scalars().all())

async def get_project_by_id(db: AsyncSession, project_id: UUID) -> Project:
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
