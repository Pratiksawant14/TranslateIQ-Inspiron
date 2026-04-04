from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models
from app.config import settings
import logging

logger = logging.getLogger(__name__)

qdrant = AsyncQdrantClient(
    url=settings.QDRANT_HOST if settings.QDRANT_HOST.startswith("http") else None,
    host=None if settings.QDRANT_HOST.startswith("http") else settings.QDRANT_HOST,
    port=settings.QDRANT_PORT if not settings.QDRANT_HOST.startswith("http") else None,
    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
)

async def ensure_collection_exists():
    collection_name = settings.QDRANT_COLLECTION_NAME
    
    try:
        collections_response = await qdrant.get_collections()
        collection_names = [col.name for col in collections_response.collections]
        
        if collection_name not in collection_names:
            logger.info(f"Creating Qdrant collection: {collection_name}")
            await qdrant.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=1024,  # BGE-M3 output dimension
                    distance=models.Distance.COSINE
                ),
                sparse_vectors_config={
                    "sparse": models.SparseVectorParams(
                        modifier=models.Modifier.NONE
                    )
                }
            )
            logger.info("Collection created successfully.")
        else:
            logger.info(f"Qdrant collection {collection_name} already exists.")
    except Exception as e:
        logger.error(f"Error ensuring Qdrant collection exists: {e}")
        # Note: In production you might want to handle this gracefully
        raise
