"""add google_id and created_at to users

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tambah kolom google_id
    op.add_column('users', sa.Column('google_id', sa.String(255), nullable=True, unique=True))
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)

    # Tambah kolom created_at
    op.add_column('users', sa.Column(
        'created_at',
        sa.DateTime(timezone=True),
        server_default=sa.text('now()'),
        nullable=True
    ))

    # Ubah hashed_password jadi nullable (untuk user Google OAuth)
    op.alter_column('users', 'hashed_password', nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'hashed_password', nullable=False)
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'created_at')
