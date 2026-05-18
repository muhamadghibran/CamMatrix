"""add face analysis tables

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-18

Tabel baru (tidak mengubah tabel yang sudah ada):
- face_analysis_jobs
- face_detections
"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'face_analysis_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recording_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('total_frames', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processed_frames', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('faces_found', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_msg', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['recording_id'], ['recordings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_face_analysis_jobs_id', 'face_analysis_jobs', ['id'])
    op.create_index('ix_face_analysis_jobs_recording_id', 'face_analysis_jobs', ['recording_id'])

    op.create_table(
        'face_detections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('timestamp_sec', sa.Float(), nullable=False),
        sa.Column('bbox_x', sa.Float(), nullable=False),
        sa.Column('bbox_y', sa.Float(), nullable=False),
        sa.Column('bbox_w', sa.Float(), nullable=False),
        sa.Column('bbox_h', sa.Float(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('face_crop_b64', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['face_analysis_jobs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_face_detections_id', 'face_detections', ['id'])
    op.create_index('ix_face_detections_job_id', 'face_detections', ['job_id'])


def downgrade() -> None:
    op.drop_index('ix_face_detections_job_id', table_name='face_detections')
    op.drop_index('ix_face_detections_id', table_name='face_detections')
    op.drop_table('face_detections')
    op.drop_index('ix_face_analysis_jobs_recording_id', table_name='face_analysis_jobs')
    op.drop_index('ix_face_analysis_jobs_id', table_name='face_analysis_jobs')
    op.drop_table('face_analysis_jobs')
