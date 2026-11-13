from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server Settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"

    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5000"

    # Gemini / LLM Settings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"
    EMBEDDING_MODEL: str = "gemini-embedding-001"

    # Qdrant Vector DB Settings
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "govguide_schemes"
    QDRANT_STORAGE_PATH: str = "./qdrant_storage"

    # Ingestion & Admin Security
    INGEST_API_KEY: str = ""

    # MongoDB Settings
    MONGODB_URI: str = "mongodb://127.0.0.1:27017/govguide"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()

