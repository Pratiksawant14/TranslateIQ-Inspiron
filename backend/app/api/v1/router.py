from fastapi import APIRouter
from app.api.v1 import projects, documents, tm, validation, review, export, glossary, style_profiles, analytics

api_router = APIRouter()

api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(documents.router, prefix="/projects", tags=["Documents"])
api_router.include_router(tm.router, prefix="/projects", tags=["Translation Memory"])
api_router.include_router(validation.router, prefix="/projects", tags=["Validation"])
api_router.include_router(review.router, tags=["Review"])
api_router.include_router(export.router, tags=["Export"])
api_router.include_router(glossary.router, prefix="/projects", tags=["Glossary"])
api_router.include_router(style_profiles.router, prefix="/projects", tags=["Style Profiles"])
api_router.include_router(analytics.router, prefix="/projects", tags=["Analytics"])
