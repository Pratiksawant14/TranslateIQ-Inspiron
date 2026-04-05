from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.qdrant_client import ensure_collection_exists
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="TranslateIQ API",
    description="AI-Powered Enterprise Translation Studio",
    version="1.0.0"
)

@app.get("/ping")
async def ping():
    return {"status": "pong"}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure qdrant collection exists
    await ensure_collection_exists()
    yield
    # Shutdown logic if any

app.router.lifespan_context = lifespan

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.APP_ENV}
