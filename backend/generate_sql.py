from sqlalchemy import create_mock_engine
from app.models import Base
# Import all models so they are attached to Base.metadata
from app.models.project import Project
from app.models.document import Document
from app.models.segment import Segment
from app.models.translation_memory import TranslationMemory
from app.models.glossary import GlossaryEntry
from app.models.style_profile import StyleProfile
from app.models.audit_log import AuditLog
from app.models.telemetry import TelemetrySignal

with open('schema.sql', 'w') as f:
    def dump(sql, *multiparams, **params):
        query = str(sql.compile(dialect=engine.dialect)).strip()
        if query:
            f.write(query + ';\n\n')

    engine = create_mock_engine('postgresql+psycopg2://', executor=dump)
    Base.metadata.create_all(engine, checkfirst=False)
