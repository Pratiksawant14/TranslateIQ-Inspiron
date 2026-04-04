from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict

class ValidationIssueResponse(BaseModel):
    id: UUID
    document_id: UUID
    segment_id: Optional[UUID]
    issue_type: str
    severity: str
    description: str
    original_text: Optional[str]
    suggested_fix: Optional[str]
    is_resolved: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ValidationReportResponse(BaseModel):
    document_id: UUID
    total_issues: int
    issues_by_severity: Dict[str, int]
    issues: List[ValidationIssueResponse]
