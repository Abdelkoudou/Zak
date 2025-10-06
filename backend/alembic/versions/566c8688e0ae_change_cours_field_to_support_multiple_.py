"""Change cours field to support multiple courses as JSON array

Revision ID: 566c8688e0ae
Revises: 208a10ce8b3b
Create Date: 2025-09-28 20:08:31.718788

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '566c8688e0ae'
down_revision = '208a10ce8b3b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### Migration to change cours from string to JSON array ###
    
    # SQLite doesn't support altering column types directly, so we'll use a table recreation approach
    connection = op.get_bind()
    
    # Create new table with updated schema
    op.create_table('questions_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('study_year', sa.Integer(), nullable=True),
        sa.Column('module', sa.String(), nullable=True),
        sa.Column('unite', sa.String(), nullable=True),
        sa.Column('speciality', sa.String(), nullable=True),
        sa.Column('cours', sa.JSON(), nullable=True),  # Changed from String to JSON
        sa.Column('exam_type', sa.String(), nullable=True),
        sa.Column('number', sa.Integer(), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=True),
        sa.Column('question_image', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copy data from old table, converting cours string to JSON array
    connection.execute(sa.text("""
        INSERT INTO questions_new (id, year, study_year, module, unite, speciality, cours, exam_type, number, question_text, question_image, created_at, updated_at)
        SELECT id, year, study_year, module, unite, speciality, 
               CASE WHEN cours IS NULL THEN NULL ELSE json_array(cours) END,
               exam_type, number, question_text, question_image, created_at, updated_at
        FROM questions
    """))
    
    # Drop old table and rename new one
    op.drop_table('questions')
    op.rename_table('questions_new', 'questions')
    
    # Recreate indexes (except for cours since it's JSON now)
    op.create_index('ix_questions_year', 'questions', ['year'], unique=False)
    op.create_index('ix_questions_study_year', 'questions', ['study_year'], unique=False)
    op.create_index('ix_questions_module', 'questions', ['module'], unique=False)
    op.create_index('ix_questions_unite', 'questions', ['unite'], unique=False)
    op.create_index('ix_questions_speciality', 'questions', ['speciality'], unique=False)
    op.create_index('ix_questions_exam_type', 'questions', ['exam_type'], unique=False)
    op.create_index('ix_questions_id', 'questions', ['id'], unique=False)


def downgrade() -> None:
    # ### Downgrade migration - convert JSON array back to string ###
    
    connection = op.get_bind()
    
    # Create old table structure
    op.create_table('questions_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('study_year', sa.Integer(), nullable=True),
        sa.Column('module', sa.String(), nullable=True),
        sa.Column('unite', sa.String(), nullable=True),
        sa.Column('speciality', sa.String(), nullable=True),
        sa.Column('cours', sa.String(), nullable=True),  # Back to String
        sa.Column('exam_type', sa.String(), nullable=True),
        sa.Column('number', sa.Integer(), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=True),
        sa.Column('question_image', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copy data back, taking first element from JSON array
    connection.execute(sa.text("""
        INSERT INTO questions_old (id, year, study_year, module, unite, speciality, cours, exam_type, number, question_text, question_image, created_at, updated_at)
        SELECT id, year, study_year, module, unite, speciality,
               CASE WHEN cours IS NULL THEN NULL ELSE json_extract(cours, '$[0]') END,
               exam_type, number, question_text, question_image, created_at, updated_at
        FROM questions
    """))
    
    # Drop new table and rename old one
    op.drop_table('questions')
    op.rename_table('questions_old', 'questions')
    
    # Recreate all original indexes
    op.create_index('ix_questions_year', 'questions', ['year'], unique=False)
    op.create_index('ix_questions_study_year', 'questions', ['study_year'], unique=False)
    op.create_index('ix_questions_module', 'questions', ['module'], unique=False)
    op.create_index('ix_questions_unite', 'questions', ['unite'], unique=False)
    op.create_index('ix_questions_speciality', 'questions', ['speciality'], unique=False)
    op.create_index('ix_questions_cours', 'questions', ['cours'], unique=False)
    op.create_index('ix_questions_exam_type', 'questions', ['exam_type'], unique=False)
    op.create_index('ix_questions_id', 'questions', ['id'], unique=False) 