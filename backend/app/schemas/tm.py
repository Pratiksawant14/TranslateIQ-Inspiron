from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List

class TMEntryCreate(BaseModel):
    project_id: UUID
    source_language: str
    target_language: str
    source_text: str
    target_text: str

class TMBulkCreate(BaseModel):
    entries: List[TMEntryCreate]

class TMEntryResponse(BaseModel):
    id: UUID
    project_id: UUID
    source_language: str
    target_language: str
    source_text: str
    target_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TMSearchRequest(BaseModel):
    source_language: str
    target_language: str
    source_text: str
    top_k: int = 5

class TMMatch(BaseModel):
    source_text: str
    target_text: str
    match_type: str
    score: float

class TMSearchResponse(BaseModel):
    matches: List[TMMatch]
    has_exact: bool
    best_match_type: str
    best_match: TMMatch | None = None
