import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class GlossaryEntry(Base):
    __tablename__ = "glossary_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    source_language = Column(String)
    target_language = Column(String)
    source_term = Column(String, nullable=False)
    target_term = Column(String, nullable=False)
    context_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
