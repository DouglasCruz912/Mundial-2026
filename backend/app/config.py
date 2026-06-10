from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    database_url: str = "postgresql+asyncpg://mundial:mundial@localhost:5432/mundial"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:5173"]
    admin_email: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
