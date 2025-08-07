"""Add user_type column to users table

Revision ID: 0001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add user_type column with default value 'student'
    op.add_column('users', sa.Column('user_type', sa.Enum('admin', 'manager', 'student', name='usertype'), nullable=False, server_default='student'))


def downgrade() -> None:
    # Remove user_type column
    op.drop_column('users', 'user_type') 