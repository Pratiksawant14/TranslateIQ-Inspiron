import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.project import Project

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    async with AsyncSession(engine) as db:
        res = await db.execute(select(Project))
        print("CURRENT PROJECTS:")
        for p in res.scalars().all():
            print(f"- {p.id} | {p.name}")

if __name__ == "__main__":
    asyncio.run(run())
