from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    SUPABASE_DATABASE_URL: str
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    QDRANT_COLLECTION_NAME: str = "translation_memory"
    APP_ENV: str = "development"
    CORS_ORIGINS: str = ""
    UPLOAD_DIR: str = "uploads"
    EXPORTS_DIR: str = "exports"
    MATCH_EXACT_THRESHOLD: float = 0.98
    MATCH_FUZZY_THRESHOLD: float = 0.75

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
