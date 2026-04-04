from pydantic import BaseModel
from typing import Optional

class ExportStatusResponse(BaseModel):
    document_id: str
    approved_count: int
    total_segments: int
    ready_to_export: bool
    completion_percentage: float
