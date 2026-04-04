import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Segment(Base):
    __tablename__ = "segments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    segment_index = Column(Integer)
    content_type = Column(String)
    source_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=True)
    tm_match_type = Column(String, nullable=True) # exact/fuzzy/new
    tm_match_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), default=utcnow)
