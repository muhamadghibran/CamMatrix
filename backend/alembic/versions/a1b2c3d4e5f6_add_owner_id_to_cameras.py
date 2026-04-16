"""Add owner_id to cameras for private camera per user

Revision ID: a1b2c3d4e5f6
Revises: 14cd67e872f1
Create Date: 2026-04-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '14cd67e872f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Tambah kolom owner_id ke tabel cameras."""
    # Tambah kolom owner_id (nullable dulu supaya data lama tidak error)
    op.add_column('cameras', sa.Column('owner_id', sa.Integer(), nullable=True))

    # Isi owner_id yang NULL dengan user pertama (admin) jika ada data lama
    op.execute("""
        UPDATE cameras
        SET owner_id = (SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1)
        WHERE owner_id IS NULL
    """)

    # Sekarang buat NOT NULL dan tambah foreign key
    op.alter_column('cameras', 'owner_id', nullable=False)
    op.create_foreign_key(
        'fk_cameras_owner_id_users',
        'cameras', 'users',
        ['owner_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_index(op.f('ix_cameras_owner_id'), 'cameras', ['owner_id'], unique=False)


def downgrade() -> None:
    """Hapus kolom owner_id dari tabel cameras."""
    op.drop_index(op.f('ix_cameras_owner_id'), table_name='cameras')
    op.drop_constraint('fk_cameras_owner_id_users', 'cameras', type_='foreignkey')
    op.drop_column('cameras', 'owner_id')
