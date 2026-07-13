from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://mathnotes:mathnotes@localhost:5433/mathnotes"

    @field_validator("database_url")
    @classmethod
    def _use_psycopg3(cls, url: str) -> str:
        """Managed Postgres providers hand out postgres:// or postgresql://
        URLs; pin the psycopg (v3) driver SQLAlchemy should use."""
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url.removeprefix(prefix)
        return url
    admin_password: str = "letmein"
    session_ttl_hours: int = 7 * 24
    # Set true in production (HTTPS) so the session cookie is Secure.
    cookie_secure: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


settings = Settings()
