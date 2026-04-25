"""add_must_change_password_to_users

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-25

C3: Tambah kolom must_change_password ke tabel users.
Default False agar admin yang sudah ada tidak terkunci.
Admin baru (dari create_admin script) akan di-set True.
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'must_change_password',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        )
    )


def downgrade() -> None:
    op.drop_column('users', 'must_change_password')
