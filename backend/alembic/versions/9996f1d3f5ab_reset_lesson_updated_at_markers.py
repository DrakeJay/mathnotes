"""reset lesson updated_at markers

Revision ID: 9996f1d3f5ab
Revises: 9a22ce190250
Create Date: 2026-07-19 13:17:56.646460

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9996f1d3f5ab'
down_revision: Union[str, Sequence[str], None] = '9a22ce190250'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """One-time data fix: seed refreshes used to trip the onupdate timestamp,
    wrongly marking never-hand-edited lessons as edited (so later refreshes
    skipped them). No lesson in any environment has real admin edits, so
    reset every marker; sync now preserves the marker going forward."""
    op.execute("UPDATE lessons SET updated_at = created_at")


def downgrade() -> None:
    pass  # data fix; nothing to restore
