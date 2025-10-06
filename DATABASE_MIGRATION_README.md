# Database Migration Guide

This guide explains how to migrate your MCQ Study App database to support multiple courses per question.

## What Changed

The `cours` field in the questions table has been changed from a single string to a JSON array to support multiple courses per question.

**Before:** `"Anatomie générale"`
**After:** `["Anatomie générale", "Système cardiovasculaire", "Système respiratoire"]`

## Migration Steps

### 1. Backup Your Database

**IMPORTANT: Always backup your database before running migrations!**

```bash
# Create a backup of your current database
cp mcq_study.db mcq_study_backup_$(date +%Y%m%d_%H%M%S).db
```

### 2. Run the Migration

Navigate to the backend directory and run the migration:

```bash
cd backend
source venv/bin/activate  # or activate your virtual environment
alembic upgrade head
```

The migration will automatically:
- Convert existing single cours strings to JSON arrays
- Update the database schema
- Preserve all existing data

### 3. Verify the Migration

You can verify the migration was successful:

```bash
python -c "
from app.database import SessionLocal
from app import models
db = SessionLocal()
questions = db.query(models.Question).limit(5).all()
for q in questions:
    print(f'Question {q.id}: cours = {q.cours} (type: {type(q.cours)})')
db.close()
"
```

You should see cours fields as Python lists (arrays).

## Rolling Back (if needed)

If you need to rollback the migration:

```bash
alembic downgrade -1
```

**Warning:** Rolling back will convert multiple courses back to single courses by taking only the first course from each array.

## Frontend Updates

The frontend has been updated to support multiple courses:
- Form fields are now in the correct order
- You can add multiple courses using the "+" button
- Existing questions will display all courses separated by commas

## Testing

Test the migration with a simple question:

1. Fill out the form with multiple courses
2. Submit the question
3. Verify it appears correctly in the list
4. Export to JSON to verify the structure

## Troubleshooting

### Migration Fails
- Check database permissions
- Ensure no other processes are using the database
- Review the backup and restore if needed

### Data Loss
- Restore from backup: `cp mcq_study_backup_TIMESTAMP.db mcq_study.db`
- Contact support if issues persist

### Performance Issues
- The JSON search is optimized for SQLite
- For large datasets, consider adding custom indexes

## Support

If you encounter issues during migration:
1. Stop the application
2. Restore from backup
3. Contact the development team with error details