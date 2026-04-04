import asyncio
import asyncpg

async def main():
    try:
        conn = await asyncpg.connect(
            user="postgres.miwordffvyfjqyvwyait",
            password="pratik#1403",
            host="aws-1-ap-south-1.pooler.supabase.com",
            port=6543,
            database="postgres"
        )
        print("Successfully connected with postgres.miwordffvyfjqyvwyait (6543)!")
        await conn.close()
    except Exception as e:
        print(f"Failed 6543: {type(e).__name__} - {e}")
        
    try:
        conn = await asyncpg.connect(
            user="postgres.miwordffvyfjqyvwyait",
            password="pratik#1403",
            host="aws-1-ap-south-1.pooler.supabase.com",
            port=5432,
            database="postgres"
        )
        print("Successfully connected with postgres.miwordffvyfjqyvwyait (5432)!")
        await conn.close()
    except Exception as e:
        print(f"Failed 5432: {type(e).__name__} - {e}")
        
    try:
        conn = await asyncpg.connect(
            user="postgres",
            password="pratik#1403",
            host="aws-1-ap-south-1.pooler.supabase.com",
            port=5432,
            database="postgres"
        )
        print("Successfully connected with plain postgres (5432)!")
        await conn.close()
    except Exception as e:
        print(f"Failed plain postgres 5432: {type(e).__name__} - {e}")

asyncio.run(main())
