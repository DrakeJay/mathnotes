import re

from sqlalchemy import select
from sqlalchemy.orm import Session


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "untitled"


def unique_slug(db: Session, model, desired: str, exclude_id: int | None = None) -> str:
    """Return `desired` or `desired-2`, `desired-3`, ... until unused."""
    base = slugify(desired)
    slug = base
    n = 2
    while True:
        query = select(model).where(model.slug == slug)
        if exclude_id is not None:
            query = query.where(model.id != exclude_id)
        if db.scalar(query) is None:
            return slug
        slug = f"{base}-{n}"
        n += 1
