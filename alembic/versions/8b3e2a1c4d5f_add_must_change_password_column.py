"""Add missing must_change_password column

Revision ID: 8b3e2a1c4d5f
Revises: 70120a3d66cb
Create Date: 2025-12-31 11:19:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8b3e2a1c4d5f'
down_revision: Union[str, Sequence[str], None] = '70120a3d66cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add column with server_default to handle existing rows
    op.add_column('users', sa.Column('must_change_password', sa.Boolean(), server_default='true', nullable=False))

def downgrade() -> None:
    op.drop_column('users', 'must_change_password')
