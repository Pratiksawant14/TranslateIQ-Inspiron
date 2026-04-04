from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ProjectAnalyticsResponse(BaseModel):
    project_id: UUID
    total_segments: int
    approved_count: int
    exact_matches: int
    fuzzy_matches: int
    new_segments: int
    tm_entries_count: int
    telemetry_count: int
    avg_confidence: Optional[float]
    completion_percentage: float
