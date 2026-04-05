import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.config import settings
from app.services.retrieval_service import retrieve_tm_matches
from uuid import UUID
import pprint

async def run():
    print("Connecting to DB...")
    engine = create_async_engine(settings.SUPABASE_DATABASE_URL)
    
    # Try one of the paraphrased sentences from Doc 04:
    test_query = "CloudSync needs at least 4GB of RAM to run properly"
    
    # Needs a real project_id. Let's read from the file we saved earlier.
    try:
        with open("../test_data/project_id.txt", "r") as f:
            project_id = f.read().strip()
    except Exception as e:
        print("Couldn't read project_id:", e)
        return

    print(f"Testing retrieval against project {project_id}")
    print(f"Query: {test_query}")

    async with AsyncSession(engine) as db:
        res = await retrieve_tm_matches(
            db=db,
            project_id=UUID(project_id),
            source_language="en",
            target_language="es",
            source_text=test_query,
            top_k=5
        )
        import json
        with open("debug_output.json", "w", encoding="utf-8") as outf:
            json.dump(res, outf, indent=2)

if __name__ == "__main__":
    asyncio.run(run())
