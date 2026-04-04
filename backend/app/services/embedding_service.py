import asyncio
import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

model = None
try:
    logger.info("Loading BAAI/bge-m3 model...")
    # BGE-M3 is heavy, but we load it once at startup
    model = SentenceTransformer("BAAI/bge-m3")
    logger.info("BAAI/bge-m3 model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load BAAI/bge-m3 model: {e}")

def _encode_single(text: str) -> list[float]:
    if model is None:
        raise RuntimeError("Embedding model is not loaded.")
    return model.encode(text).tolist()

def _encode_batch(texts: list[str]) -> list[list[float]]:
    if model is None:
        raise RuntimeError("Embedding model is not loaded.")
    # encode() returns a numpy array, tolist() converts it to list of lists
    return model.encode(texts).tolist()

async def generate_embedding(text: str) -> list[float]:
    return await asyncio.to_thread(_encode_single, text)

async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    return await asyncio.to_thread(_encode_batch, texts)
