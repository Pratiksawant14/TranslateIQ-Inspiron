"""
Diagnose TM matching issue.
Check what TM entries exist and what language keys they use vs what classification queries.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, func, text
from app.config import settings
from app.models.translation_memory import TranslationMemory
from app.models.segment import Segment
from app.models.document import Document

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    async with AsyncSession(engine) as db:
        
        # 1. Check total TM entries and what languages they use
        print("=== TM ENTRIES BY LANGUAGE ===")
        result = await db.execute(
            text("SELECT source_language, target_language, COUNT(*) as cnt FROM translation_memory GROUP BY source_language, target_language ORDER BY cnt DESC LIMIT 20")
        )
        for row in result.all():
            print(f"  src='{row[0]}' | tgt='{row[1]}' | count={row[2]}")
        
        # 2. Check most recent TM entries
        print("\n=== RECENT TM ENTRIES (last 5) ===")
        recent = await db.execute(
            select(TranslationMemory)
            .order_by(TranslationMemory.created_at.desc())
            .limit(5)
        )
        for tm in recent.scalars().all():
            print(f"  src_lang={tm.source_language} | tgt_lang={tm.target_language}")
            print(f"  source: {tm.source_text[:60]}")
            print(f"  target: {tm.target_text[:60]}")
            print()
        
        # 3. Check recent segments and their match types
        print("=== RECENT SEGMENTS TM MATCH DISTRIBUTION ===")
        result2 = await db.execute(
            text("SELECT tm_match_type, COUNT(*) FROM segments GROUP BY tm_match_type ORDER BY COUNT(*) DESC")
        )
        for row in result2.all():
            print(f"  {row[0]}: {row[1]} segments")
        
        # 4. Check the most recent document's project
        print("\n=== RECENT DOCUMENTS ===")
        docs = await db.execute(
            select(Document).order_by(Document.created_at.desc()).limit(4)
        )
        for doc in docs.scalars().all():
            print(f"  doc={doc.id} | project={doc.project_id} | status={doc.status}")

if __name__ == "__main__":
    asyncio.run(run())
