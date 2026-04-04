from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class GlossaryEntryCreate(BaseModel):
    source_language: str
    target_language: str
    source_term: str
    target_term: str
    context_notes: Optional[str] = None

class GlossaryEntryResponse(BaseModel):
    id: UUID
    project_id: UUID
    source_language: str
    target_language: str
    source_term: str
    target_term: str
    context_notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
