from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime

from app.database import Base

class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("segments.id", ondelete="CASCADE"), nullable=True)
    issue_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # low/medium/high
    description = Column(Text, nullable=False)
    original_text = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    document = relationship("Document", backref="validation_issues")
    segment = relationship("Segment", backref="validation_issues")
