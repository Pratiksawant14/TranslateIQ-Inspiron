"""add_target_language_to_projects

Revision ID: e9aa49826e9d
Revises: ea86c5f0bdce
Create Date: 2026-04-04 17:34:07.944473

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9aa49826e9d'
down_revision: Union[str, Sequence[str], None] = 'ea86c5f0bdce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('projects', sa.Column('target_language', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('projects', 'target_language')
