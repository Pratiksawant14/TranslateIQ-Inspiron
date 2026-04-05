import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, func
from app.config import settings
from app.models.translation_memory import TranslationMemory

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    async with AsyncSession(engine) as db:
        count = await db.scalar(select(func.count()).select_from(TranslationMemory))
        print('Total TM entries:', count)

if __name__ == "__main__":
    asyncio.run(run())
