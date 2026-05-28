"""Application settings loaded from environment.

Defines `Settings` built on `pydantic-settings` and a `settings` instance
used throughout the server for configuration values like the database URL
and JWT secrets.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:jeetu@localhost:5432/delete"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "jeetu"
    POSTGRES_DB: str = "delete"

    SECRET_KEY: str = "jeetsecret"
    ALGORITHM: str = "HS256"

    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
    )

settings = Settings()