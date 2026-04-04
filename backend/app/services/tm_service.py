from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4, UUID
from fastapi import HTTPException
from qdrant_client.models import PointStruct

from app.models.translation_memory import TranslationMemory
from app.config import settings
from app.qdrant_client import qdrant
from app.services.embedding_service import generate_embedding, generate_embeddings_batch

async def store_tm_entry(
    db: AsyncSession, 
    project_id: UUID, 
    source_language: str, 
    target_language: str, 
    source_text: str, 
    target_text: str
) -> TranslationMemory:
    
    emb = await generate_embedding(source_text)
    entry_id = uuid4()
    entry_id_str = str(entry_id)

    # 1. Qdrant
    point = PointStruct(
        id=entry_id_str,
        vector=emb,
        payload={
            "project_id": str(project_id),
            "source_language": source_language,
            "target_language": target_language,
            "source_text": source_text,
            "target_text": target_text
        }
    )
    await qdrant.upsert(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        points=[point]
    )

    # 2. PostgreSQL
    db_entry = TranslationMemory(
        id=entry_id,
        project_id=project_id,
        source_language=source_language,
        target_language=target_language,
        source_text=source_text,
        target_text=target_text,
        qdrant_vector_id=entry_id_str
    )
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)

    return db_entry

async def bulk_store_tm_entries(db: AsyncSession, entries: list[dict]) -> int:
    if not entries:
        return 0

    texts = [entry["source_text"] for entry in entries]
    embeddings = await generate_embeddings_batch(texts)

    points = []
    pg_records = []

    for entry, emb in zip(entries, embeddings):
        entry_id = uuid4()
        entry_id_str = str(entry_id)
        
        points.append(
            PointStruct(
                id=entry_id_str,
                vector=emb,
                payload={
                    "project_id": str(entry["project_id"]),
                    "source_language": entry["source_language"],
                    "target_language": entry["target_language"],
                    "source_text": entry["source_text"],
                    "target_text": entry["target_text"]
                }
            )
        )
        
        pg_records.append(
            TranslationMemory(
                id=entry_id,
                project_id=entry["project_id"],
                source_language=entry["source_language"],
                target_language=entry["target_language"],
                source_text=entry["source_text"],
                target_text=entry["target_text"],
                qdrant_vector_id=entry_id_str
            )
        )

    # Store in Qdrant batch
    await qdrant.upsert(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        points=points
    )

    # Store in DB batch
    db.add_all(pg_records)
    await db.commit()

    return len(pg_records)
