from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class StyleProfileCreate(BaseModel):
    name: str
    tone: str
    custom_rules: Optional[str] = None
    target_language: str

class StyleProfileResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    tone: str
    custom_rules: Optional[str]
    target_language: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
