import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    filename = Column(String)
    file_type = Column(String) # pdf or docx
    status = Column(String) # uploaded, parsing, validating, translating, reviewing, completed
    raw_content = Column(Text, nullable=True)
    total_segments = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)
