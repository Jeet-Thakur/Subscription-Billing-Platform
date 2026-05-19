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

    model_config = SettingsConfigDict(
        env_file=".env",
    )

settings = Settings()