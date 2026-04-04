from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

class DocumentResponse(BaseModel):
    id: UUID
    project_id: UUID
    filename: str
    file_type: str
    status: str
    total_segments: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ParseResponse(BaseModel):
    document_id: UUID
    total_segments: int
    status: str

class ClassificationRequest(BaseModel):
    source_language: str
    target_language: str

class ClassificationResponse(BaseModel):
    document_id: UUID
    total_segments: int
    exact_count: int
    fuzzy_count: int
    new_count: int
    auto_approved_count: int

from typing import Optional

class TranslationRequest(BaseModel):
    target_language: str
    source_language: str
    style_profile_id: Optional[UUID] = None

class TranslationResponse(BaseModel):
    document_id: UUID
    translated_count: int
    skipped_count: int
    target_language: str
