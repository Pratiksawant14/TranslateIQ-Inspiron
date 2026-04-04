import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class TranslationMemory(Base):
    __tablename__ = "translation_memory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    source_language = Column(String)
    target_language = Column(String)
    source_text = Column(Text)
    target_text = Column(Text)
    qdrant_vector_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
