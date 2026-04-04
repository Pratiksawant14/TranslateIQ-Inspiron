import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class StyleProfile(Base):
    __tablename__ = "style_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    name = Column(String)
    tone = Column(String) # formal/technical/conversational/official/social
    custom_rules = Column(Text, nullable=True)
    target_language = Column(String)
    created_at = Column(DateTime(timezone=True), default=utcnow)
