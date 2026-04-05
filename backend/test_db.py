import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings

async def test():
    try:
        engine = create_async_engine(settings.SUPABASE_DATABASE_URL, pool_timeout=5)
        async with engine.connect() as conn:
            print("DB RESPONSE OK")
        await engine.dispose()
    except Exception as e:
        print("DB ERROR:", e)

asyncio.run(test())
