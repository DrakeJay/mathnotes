from pathlib import Path

from alembic import command
from alembic.config import Config

BACKEND_DIR = Path(__file__).resolve().parent.parent


def alembic_config(database_url: str | None = None) -> Config:
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    if database_url:
        cfg.set_main_option("sqlalchemy.url", database_url)
    return cfg


def run_migrations() -> None:
    """Bring the database to the latest revision. Called on startup — fine
    for a single process; with multiple replicas, run `alembic upgrade head`
    as a deploy step instead."""
    command.upgrade(alembic_config(), "head")
