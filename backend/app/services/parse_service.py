import os
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException, status
from uuid import UUID

from app.models.document import Document
from app.models.segment import Segment
from app.services.document_service import update_document_status

# Ensure docling is imported safely wrapped in the thread
def _run_docling_sync(file_path: str) -> list:
    from docling.document_converter import DocumentConverter
    converter = DocumentConverter()
    try:
        result = converter.convert(file_path)
    except Exception as e:
        raise RuntimeError(f"Docling conversion failed: {str(e)}")
        
    extracted_elements = []
    # parse document items
    for item, level in result.document.iterate_items():
        if hasattr(item, 'text') and item.text:
            text = item.text
            label = str(getattr(item, 'label', 'paragraph')).lower()
            extracted_elements.append({"label": label, "text": text})
            
    return extracted_elements

def _map_content_type(label: str) -> str:
    if any(k in label for k in ["heading", "title", "section"]):
        return "heading"
    elif any(k in label for k in ["table", "cell"]):
        return "table"
    elif any(k in label for k in ["list", "item"]):
        return "list"
    return "paragraph"

async def parse_document(db: AsyncSession, document_id: UUID) -> dict:
    # Step 1: Load document record
    result = await db.execute(select(Document).filter(Document.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    # Build file path
    from app.config import settings
    upload_dir = settings.UPLOAD_DIR
    file_path = os.path.join(upload_dir, f"{str(document.id)}.{document.file_type}")
    
    if not os.path.exists(file_path):
        await update_document_status(db, document.id, "error")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Physical file missing at {file_path}")

    # Step 2: Update status to parsing
    document = await update_document_status(db, document.id, "parsing")
    
    # Step 3: Run Docling async
    try:
        raw_elements = await asyncio.to_thread(_run_docling_sync, file_path)
    except Exception as e:
        await update_document_status(db, document.id, "error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"File parsing failed: {str(e)}")
        
    # Step 4: Filter and clean segments
    segments_to_insert = []
    segment_index = 0
    for el in raw_elements:
        text = el.get("text", "").strip()
        if not text or len(text) < 3:
            continue
            
        content_type = _map_content_type(el.get("label", ""))
        
        segments_to_insert.append(
            Segment(
                document_id=document.id,
                segment_index=segment_index,
                content_type=content_type,
                source_text=text,
                tm_match_type="new",
                status="pending"
            )
        )
        segment_index += 1

    # Step 5: Clear old segments and save new segments to DB
    await db.execute(delete(Segment).where(Segment.document_id == document.id))
    
    if segments_to_insert:
        db.add_all(segments_to_insert)
        
    await db.commit()
    
    # Step 6: Update document total_segments and status='validating'
    document.total_segments = len(segments_to_insert)
    document.status = "parsed"
    await db.commit()
    await db.refresh(document)
    
    # Step 7: Return response
    return {
        "document_id": document.id,
        "total_segments": document.total_segments,
        "status": document.status
    }
