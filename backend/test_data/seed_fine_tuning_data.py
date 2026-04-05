"""
Seeds 500+ Telemetry signals to unlock the Fine-Tuning Readiness button
"""
import asyncio
import os
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.telemetry import TelemetrySignal

async def run():
    print("Connecting to DB...")
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    
    try:
        with open(os.path.join(os.path.dirname(__file__), "..", "..", "test_data", "project_id.txt"), "r") as f:
            proj_id = f.read().strip()
    except Exception as e:
        print("Couldn't read project_id:", e)
        return

    print(f"Adding 500+ telemetry signals for project {proj_id}...")

    async with AsyncSession(engine) as db:
        from app.models.document import Document
        from app.models.segment import Segment
        docs = await db.execute(select(Document.id).where(Document.project_id == uuid.UUID(proj_id)))
        doc_ids = [r[0] for r in docs.all()]
        if not doc_ids:
            print("No documents found in project")
            return
            
        segs = await db.execute(select(Segment.id).where(Segment.document_id.in_(doc_ids)).limit(1))
        seg_id = segs.scalar()
        if not seg_id:
            print("No segments found")
            return
            
        for i in range(510):
            sig = TelemetrySignal(
                segment_id=seg_id,  # Link to valid project segment
                source_text=f"Dummy source {i}",
                mt_output=f"Dummy output {i}",
                human_edit=f"Dummy edit {i}" if i % 2 == 0 else None,
                signal_label="desirable" if i % 2 == 0 else "undesirable"
            )
            db.add(sig)
        await db.commit()
        print("Successfully seeded 510 telemetry signals.")

if __name__ == "__main__":
    asyncio.run(run())
