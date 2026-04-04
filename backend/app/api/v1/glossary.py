from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from uuid import UUID
import csv
import io

from app.database import get_db
from app.models.glossary import GlossaryEntry
from app.schemas.glossary import GlossaryEntryCreate, GlossaryEntryResponse
from app.services.project_service import get_project_by_id

router = APIRouter()

@router.post("/{project_id}/glossary", response_model=GlossaryEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_glossary_entry(
    project_id: UUID,
    entry: GlossaryEntryCreate,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    db_entry = GlossaryEntry(
        project_id=project_id,
        source_language=entry.source_language,
        target_language=entry.target_language,
        source_term=entry.source_term,
        target_term=entry.target_term,
        context_notes=entry.context_notes,
    )
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@router.get("/{project_id}/glossary", response_model=List[GlossaryEntryResponse])
async def get_glossary_entries(
    project_id: UUID,
    source_language: Optional[str] = None,
    target_language: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    filters = [GlossaryEntry.project_id == project_id]
    if source_language:
        filters.append(GlossaryEntry.source_language == source_language)
    if target_language:
        filters.append(GlossaryEntry.target_language == target_language)
    
    result = await db.execute(
        select(GlossaryEntry).where(and_(*filters)).order_by(GlossaryEntry.created_at.desc())
    )
    return result.scalars().all()

@router.delete("/{project_id}/glossary/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_glossary_entry(
    project_id: UUID,
    entry_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    result = await db.execute(
        select(GlossaryEntry).where(GlossaryEntry.id == entry_id, GlossaryEntry.project_id == project_id)
    )
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Glossary entry not found")
    
    await db.delete(entry)
    await db.commit()

@router.post("/{project_id}/glossary/import", status_code=status.HTTP_201_CREATED)
async def import_glossary_csv(
    project_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    for row in reader:
        entry = GlossaryEntry(
            project_id=project_id,
            source_language=row.get("source_language", ""),
            target_language=row.get("target_language", ""),
            source_term=row.get("source_term", ""),
            target_term=row.get("target_term", ""),
            context_notes=row.get("context_notes"),
        )
        db.add(entry)
        count += 1
    
    await db.commit()
    return {"imported_count": count}
