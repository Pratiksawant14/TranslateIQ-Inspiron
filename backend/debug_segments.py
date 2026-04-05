import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.document import Document
from app.models.segment import Segment

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    async with AsyncSession(engine) as db:
        # Get latest document
        docs = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(1))
        doc = docs.scalars().first()
        if not doc:
            print("No documents found")
            return
            
        print(f"Latest document: {doc.filename} (ID: {doc.id}, Status: {doc.status})")
        
        # Get segments
        segs = await db.execute(select(Segment).where(Segment.document_id == doc.id).order_by(Segment.segment_index))
        segments = segs.scalars().all()
        
        for s in segments:
            print(f"[{s.segment_index}] {s.source_text[:30]:<30} | {s.tm_match_type} | {s.tm_match_score} | {s.status}")

if __name__ == "__main__":
    asyncio.run(run())
