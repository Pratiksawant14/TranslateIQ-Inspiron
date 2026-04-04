from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID

class MTQEScoreResponse(BaseModel):
    document_id: UUID
    scored_count: int
    average_confidence: float
    segments_needing_review: int

class ReviewSegmentResponse(BaseModel):
    id: UUID
    segment_index: int
    source_text: str
    translated_text: Optional[str]
    tm_match_type: Optional[str]
    confidence_score: Optional[float]
    status: str

    model_config = ConfigDict(from_attributes=True)

class ReviewSessionResponse(BaseModel):
    document_id: UUID
    total: int
    approved_count: int
    pending_count: int
    rejected_count: int
    completion_percentage: float
    segments: List[ReviewSegmentResponse]

class EditSegmentRequest(BaseModel):
    new_translation: str
