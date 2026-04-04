from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from typing import List
from uuid import UUID

from app.models.document import Document

async def create_document(db: AsyncSession, project_id: UUID, filename: str, file_type: str) -> Document:
    db_document = Document(
        project_id=project_id,
        filename=filename,
        file_type=file_type,
        status="uploaded"
    )
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    return db_document

async def get_documents_by_project(db: AsyncSession, project_id: UUID) -> List[Document]:
    result = await db.execute(select(Document).filter(Document.project_id == project_id).order_by(Document.created_at.desc()))
    return list(result.scalars().all())

async def update_document_status(db: AsyncSession, document_id: UUID, status_value: str) -> Document:
    result = await db.execute(select(Document).filter(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    document.status = status_value
    await db.commit()
    await db.refresh(document)
    return document
