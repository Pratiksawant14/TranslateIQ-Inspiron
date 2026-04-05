import asyncio
from app.api.v1.projects import get_all_projects
from app.database import get_db

async def run():
    print("Testing get_all_projects directly...")
    try:
        async for db in get_db():
            projects = await get_all_projects(db)
            print(f"Success! Found {len(projects)} projects.")
            break
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(run())
