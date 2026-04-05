import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def run():
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    async with engine.begin() as conn:
        r = await conn.execute(text("SELECT id, tm_match_type FROM segments LIMIT 15"))
        for row in r.fetchall():
            print(row)

if __name__ == "__main__":
    asyncio.run(run())
