import asyncio
import uuid
import pprint
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, update
from app.config import settings
from app.models.document import Document
from app.models.segment import Segment
from app.services.classification_service import classify_document_segments

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    
    with open("../test_data/project_id.txt", "r") as f:
        proj_id = f.read().strip()
        
    async with AsyncSession(engine) as db:
        # Get latest document
        docs = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(1))
        doc = docs.scalars().first()
        
        if not doc:
            print("No documents found")
            return
            
        print(f"Resetting statuses for {doc.filename} to pending...")
        # Reset segments to pending so we can re-classify
        await db.execute(update(Segment).where(Segment.document_id == doc.id).values(status="pending", tm_match_type=None, tm_match_score=0.0))
        await db.commit()
        
        print(f"Classifying {doc.filename} (ID: {doc.id})")
        res = await classify_document_segments(
            db=db,
            document_id=str(doc.id),
            project_id=proj_id,
            source_language="en",
            target_language="es"
        )
        print("Classification Result:")
        pprint.pprint(res)

if __name__ == "__main__":
    asyncio.run(run())
