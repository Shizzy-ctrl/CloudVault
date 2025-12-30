"""Add shares table

Revision ID: 567890abcdef
Revises: 1234567890ab
Create Date: 2023-10-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '567890abcdef'
down_revision = '1234567890ab'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create shares table
    op.create_table('shares',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('public_id', sa.String(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=True),
        sa.Column('is_shared', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shares_id'), 'shares', ['id'], unique=False)
    op.create_index(op.f('ix_shares_public_id'), 'shares', ['public_id'], unique=True)

    # 2. Add share_id to files, drop old columns
    op.add_column('files', sa.Column('share_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_files_share_id', 'files', 'shares', ['share_id'], ['id'])
    
    # We drop columns that moved to Shares. 
    # NOTE: This implies data loss for existing "files" regarding their public access.
    # Given "simple app" and dev status, this is acceptable.
    op.drop_index('ix_files_public_id', table_name='files')
    op.drop_column('files', 'public_id')
    op.drop_column('files', 'owner_id')
    op.drop_column('files', 'created_at')
    op.drop_column('files', 'expires_at')
    op.drop_column('files', 'password_hash')
    op.drop_column('files', 'is_shared')


def downgrade() -> None:
    # Inverse of upgrade
    # (Simplified downgrade for robustness in dev env)
    op.add_column('files', sa.Column('is_shared', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('files', sa.Column('password_hash', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('files', sa.Column('expires_at', sa.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column('files', sa.Column('created_at', sa.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column('files', sa.Column('owner_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('files', sa.Column('public_id', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.create_index('ix_files_public_id', 'files', ['public_id'], unique=True)
    
    op.drop_constraint('fk_files_share_id', 'files', type_='foreignkey')
    op.drop_column('files', 'share_id')
    
    op.drop_index(op.f('ix_shares_public_id'), table_name='shares')
    op.drop_index(op.f('ix_shares_id'), table_name='shares')
    op.drop_table('shares')
