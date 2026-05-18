"""add person tracking tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-18

Tabel baru:
- tracked_persons      : identitas orang unik yang terdeteksi lintas kamera
- person_sightings     : setiap kemunculan orang per rekaman/kamera
- tracking_sessions    : status sesi analisis cross-camera
"""
from alembic import op
import sqlalchemy as sa

revision    = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # ── tracked_persons ──────────────────────────────────────────────────────
    op.create_table(
        "tracked_persons",
        sa.Column("id",                 sa.Integer,  primary_key=True, index=True),
        sa.Column("embedding_json",     sa.Text,     nullable=False),
        sa.Column("first_thumbnail",    sa.Text,     nullable=True),
        sa.Column("first_camera_name",  sa.String(255), nullable=True),
        sa.Column("first_seen_at",      sa.Float,    nullable=True),
        sa.Column("total_sightings",    sa.Integer,  server_default="0"),
        sa.Column("created_at",         sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── person_sightings ─────────────────────────────────────────────────────
    op.create_table(
        "person_sightings",
        sa.Column("id",                  sa.Integer, primary_key=True, index=True),
        sa.Column("person_id",           sa.Integer,
                  sa.ForeignKey("tracked_persons.id", ondelete="CASCADE"), index=True),
        sa.Column("recording_id",        sa.Integer,
                  sa.ForeignKey("recordings.id",      ondelete="CASCADE"), index=True),
        sa.Column("camera_name",         sa.String(255), nullable=True),
        sa.Column("camera_id",           sa.Integer,     nullable=True),
        sa.Column("first_timestamp_sec", sa.Float,       nullable=False),
        sa.Column("last_timestamp_sec",  sa.Float,       nullable=False),
        sa.Column("frame_count",         sa.Integer,     server_default="1"),
        sa.Column("thumbnail",           sa.Text,        nullable=True),
        sa.Column("created_at",          sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── tracking_sessions ────────────────────────────────────────────────────
    op.create_table(
        "tracking_sessions",
        sa.Column("id",                   sa.Integer, primary_key=True, index=True),
        sa.Column("status",               sa.String(20), server_default="pending"),
        sa.Column("recordings_analyzed",  sa.Integer,    server_default="0"),
        sa.Column("persons_found",        sa.Integer,    server_default="0"),
        sa.Column("error_msg",            sa.Text,       nullable=True),
        sa.Column("created_at",           sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("finished_at",          sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("tracking_sessions")
    op.drop_table("person_sightings")
    op.drop_table("tracked_persons")
