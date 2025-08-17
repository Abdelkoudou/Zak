# Migration Guide for Enhanced MCQ Study App

This document provides a step-by-step migration process for upgrading the MCQ Study App with new features including student fields, question enhancements, answer labels, and activation key system.

## 🚀 New Features Overview

### Student Enhancements
- Added `year_of_study` field (integer) for students
- Added `speciality` field (string) for students

### Question Enhancements
- Added `speciality` field to questions
- Added `chapter` field to questions
- Questions now require 5 answers labeled 'a' through 'e'
- Support for multiple correct answers per question

### Activation Key System
- New `ActivationKey` model for paid user activation
- Key generation by owners/admins
- Student activation via keys instead of direct payment status updates

## 📋 Migration Steps

### Step 1: Backup Current Database

**⚠️ CRITICAL: Always backup before migration!**

```bash
cd backend
cp mcq_study.db mcq_study_backup_$(date +%Y%m%d_%H%M%S).db
```

### Step 2: Update Dependencies

Ensure all dependencies are installed:

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Apply Database Migration

The migration will add new fields and tables:

```bash
cd backend
alembic upgrade head
```

This migration adds:
- `users.year_of_study` column (nullable)
- `users.speciality` column (nullable)
- `questions.speciality` column (nullable)
- `questions.chapter` column (nullable)
- `answers.option_label` column (a-e labels)
- `activation_keys` table with relationships

### Step 4: Verify Migration Success

Check that all tables and columns exist:

```bash
python -c "
import sqlite3
conn = sqlite3.connect('mcq_study.db')
cursor = conn.cursor()

# Check new user columns
cursor.execute('PRAGMA table_info(users);')
print('Users table schema:')
for col in cursor.fetchall():
    print(f'  {col[1]} {col[2]}')

# Check new question columns
cursor.execute('PRAGMA table_info(questions);')
print('\nQuestions table schema:')
for col in cursor.fetchall():
    print(f'  {col[1]} {col[2]}')

# Check activation_keys table
cursor.execute('PRAGMA table_info(activation_keys);')
print('\nActivation Keys table schema:')
for col in cursor.fetchall():
    print(f'  {col[1]} {col[2]}')

conn.close()
"
```

### Step 5: Test Application Startup

```bash
python run.py
```

Verify the application starts without errors.

### Step 6: Update Existing Data (Optional)

If you have existing data, you may want to populate the new fields:

```python
# Example script to update existing data
import sqlite3

conn = sqlite3.connect('mcq_study.db')
cursor = conn.cursor()

# Set default speciality for existing students
cursor.execute("""
    UPDATE users 
    SET speciality = 'General Studies', year_of_study = 1 
    WHERE user_type = 'STUDENT' AND speciality IS NULL
""")

# Set default speciality for existing questions
cursor.execute("""
    UPDATE questions 
    SET speciality = 'General', chapter = 'Miscellaneous' 
    WHERE speciality IS NULL
""")

# Update existing answers to have option labels
cursor.execute("""
    UPDATE answers 
    SET option_label = 
        CASE 
            WHEN id % 5 = 1 THEN 'a'
            WHEN id % 5 = 2 THEN 'b'
            WHEN id % 5 = 3 THEN 'c'
            WHEN id % 5 = 4 THEN 'd'
            ELSE 'e'
        END
    WHERE option_label IS NULL
""")

conn.commit()
conn.close()
```

## 🔑 Using the Activation Key System

### For Owners/Admins: Creating Keys

1. Login as owner/admin
2. Use the admin endpoint to create keys:

```bash
curl -X POST "http://localhost:8000/admin/activation-keys" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### For Students: Using Keys

1. Register as student (optionally include year_of_study and speciality)
2. Login to get access token
3. Use activation endpoint:

```bash
curl -X POST "http://localhost:8000/users/activate" \
     -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"key": "ACTIVATION_KEY"}'
```

## 📊 New API Endpoints

### Student Registration (Enhanced)
```
POST /auth/register
{
    "email": "student@example.com",
    "username": "student123",
    "password": "password123",
    "year_of_study": 3,
    "speciality": "Computer Science"
}
```

### Question Creation (Enhanced)
```
POST /questions/
{
    "year": 2024,
    "course": "Advanced Programming",
    "speciality": "Computer Science",
    "chapter": "Object-Oriented Programming",
    "number": 1,
    "question_text": "What is encapsulation?",
    "answers": [
        {"answer_text": "Hiding details", "is_correct": true, "option_label": "a"},
        {"answer_text": "Wrong answer", "is_correct": false, "option_label": "b"},
        {"answer_text": "Wrong answer", "is_correct": false, "option_label": "c"},
        {"answer_text": "Wrong answer", "is_correct": false, "option_label": "d"},
        {"answer_text": "Wrong answer", "is_correct": false, "option_label": "e"}
    ]
}
```

### New Filtering Options
```
GET /questions/?speciality=Computer Science&chapter=OOP
GET /questions/specialities/list
GET /questions/chapters/list
```

### Activation Key Management
```
POST /admin/activation-keys          # Create key (admin only)
GET /admin/activation-keys           # List keys (admin only)
GET /admin/activation-keys/stats     # Key statistics (admin only)
POST /users/activate                 # Use key (student)
```

## 🔄 Rollback Procedure

If you need to rollback the migration:

1. Stop the application
2. Restore backup:
   ```bash
   cp mcq_study_backup_TIMESTAMP.db mcq_study.db
   ```
3. Downgrade migration:
   ```bash
   alembic downgrade 0001
   ```

## ✅ Verification Checklist

After migration, verify:

- [ ] Application starts without errors
- [ ] Existing users can still login
- [ ] Existing questions are still accessible
- [ ] New user registration includes student fields
- [ ] Question creation includes new fields
- [ ] Activation key system works
- [ ] All answer options have labels (a-e)
- [ ] Admin dashboard shows new statistics
- [ ] Question filtering by speciality/chapter works

## 🆘 Troubleshooting

### Common Issues

1. **Migration fails with "table already exists"**
   - Check current migration status: `alembic current`
   - Mark migration as applied: `alembic stamp head`

2. **Application won't start after migration**
   - Check server logs for specific error
   - Verify all new dependencies are installed
   - Check database file permissions

3. **Existing questions missing new fields**
   - Run the data update script in Step 6
   - Or update manually via admin interface

### Getting Help

1. Check application logs: `python run.py` output
2. Verify database schema with SQLite browser
3. Use the test script to verify functionality
4. Check API documentation at `/docs` endpoint

## 📈 Performance Considerations

- New indexes are automatically created for new fields
- Activation key lookups are optimized with unique index
- Consider adding indexes on speciality/chapter if you have many questions
- Monitor database size growth with activation keys

## 🔐 Security Notes

- Activation keys are randomly generated 16-character strings
- Keys are single-use and automatically marked as used
- Only owners/admins can generate keys
- Consider implementing key expiration for enhanced security

---

**Migration completed successfully! 🎉**

Your MCQ Study App now supports enhanced student profiles, detailed question categorization, and a secure activation key system.