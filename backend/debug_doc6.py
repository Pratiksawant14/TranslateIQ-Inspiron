import asyncio
import uuid
import pprint
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.document import Document
from app.models.segment import Segment
from app.services.retrieval_service import retrieve_tm_matches

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    
    with open("../test_data/project_id.txt", "r") as f:
        proj_id = f.read().strip()
        
    async with AsyncSession(engine) as db:
        # Find 06_new_product_launch.docx
        docs = await db.execute(select(Document).where(Document.filename.like('%06_new_product%')).order_by(Document.created_at.desc()).limit(1))
        doc = docs.scalars().first()
        
        if not doc:
            print("Doc 06 not found")
            return
            
        print(f"Checking Doc: {doc.filename}")
        segs = await db.execute(select(Segment).where(Segment.document_id == doc.id).order_by(Segment.segment_index))
        segments = segs.scalars().all()
        
        for s in segments:
            res = await retrieve_tm_matches(db, uuid.UUID(proj_id), "en", "es", s.source_text, 1)
            mt = res.get("best_match_type", "new")
            score = 0.0
            if mt != "new":
               score = res.get("matches", [])[0].get("score", 0.0)
            if mt == 'fuzzy':
                print(f"FUZZY MATCH! -> Segment '{s.source_text}' matched '{res['matches'][0]['source_text']}' with score {score}")

if __name__ == "__main__":
    asyncio.run(run())
