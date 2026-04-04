from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_language: str

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    source_language: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
