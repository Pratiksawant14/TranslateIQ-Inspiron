import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("segments.id"))
    action = Column(String) # accepted/edited/rejected/auto_fixed
    original_text = Column(Text, nullable=True)
    new_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
