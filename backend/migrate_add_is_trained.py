"""
Migration: Add is_trained column to telemetry_signals table.
Run once to update the live Supabase PostgreSQL schema.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    async with engine.begin() as conn:
        # Add column with default=false (existing rows become is_trained=false = untrained)
        await conn.execute(text("""
            ALTER TABLE telemetry_signals 
            ADD COLUMN IF NOT EXISTS is_trained BOOLEAN NOT NULL DEFAULT FALSE;
        """))
        print("Migration complete: is_trained column added to telemetry_signals")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
