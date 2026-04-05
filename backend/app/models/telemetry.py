import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class TelemetrySignal(Base):
    __tablename__ = "telemetry_signals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("segments.id"))
    source_text = Column(Text)
    mt_output = Column(Text)
    human_edit = Column(Text, nullable=True)
    signal_label = Column(String)  # desirable/undesirable
    # JIT Incremental Learning flag:
    # False = newly approved, not yet trained into local model (in the "delta queue")
    # True  = already incorporated into LoRA adapter via incremental fine-tuning
    is_trained = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), default=utcnow)
