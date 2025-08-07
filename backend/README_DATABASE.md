# Database Setup and Management Guide

This guide will help you properly set up, reset, and manage the database for the MCQ Study App, with special focus on the Owner/Superuser functionality.

## 🚨 Quick Reset (Start Fresh)

If you want to completely start over and delete all data:

```bash
cd backend
python scripts/reset_database.py
```

**⚠️ WARNING:** This will delete ALL your data! Make sure you want to do this.

## 📋 Step-by-Step Database Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup Options

#### Option A: Complete Reset (Recommended for fresh start)
```bash
python scripts/reset_database.py
```

#### Option B: Manual Setup
```bash
# Create/update database tables
python -c "from app.database import engine; from app import models; models.Base.metadata.create_all(bind=engine)"

# Create owner user
python scripts/create_owner.py

# (Optional) Add sample data
python scripts/seed_data.py
```

### 3. Start the Application

```bash
python run.py
```

The server will start on http://localhost:8000

## 👑 Owner/Superuser Account

### Default Owner Credentials
- **Email:** `doudous6666@gmail.com`
- **Password:** `123456789`
- **Username:** `owner`

### Owner Privileges
- ✅ **Highest level access** - can do anything
- ✅ **Cannot be edited by other users** (admins/managers cannot change owner)
- ✅ **Cannot be deleted by other users**
- ✅ **Can manage all other users**
- ✅ **Bypasses payment requirements**
- ✅ **Has all admin and manager permissions**

### Important Security Notes
- 🔒 **Change the default password** after first login
- 🔒 **Only one owner account** should exist
- 🔒 **Owner has supreme privileges** - protect this account

## 🛠️ Database Management Commands

### Check Current Database State
```bash
python -c "
import sqlite3
conn = sqlite3.connect('mcq_study.db')
cursor = conn.cursor()
cursor.execute('SELECT id, email, username, user_type, is_paid FROM users;')
users = cursor.fetchall()
print('Current users:')
for user in users:
    print(f'  ID: {user[0]}, Email: {user[1]}, Username: {user[2]}, Type: {user[3]}, Paid: {user[4]}')
conn.close()
"
```

### Create Owner User Only
```bash
python scripts/create_owner.py
```

### Add Sample Data (Questions/Answers)
```bash
python scripts/seed_data.py
```

### Backup Database
```bash
cp mcq_study.db mcq_study_backup_$(date +%Y%m%d_%H%M%S).db
```

## 🔧 Troubleshooting

### Problem: Admin can still edit owner user
**Solution:** Make sure you're using the latest code and that the owner user type is exactly "owner" (not "OWNER" or "Owner").

### Problem: Multiple owner users exist
**Solution:** 
```bash
python scripts/create_owner.py  # Will detect and help you fix this
```

### Problem: Database is corrupted or has issues
**Solution:**
```bash
python scripts/reset_database.py  # Complete fresh start
```

### Problem: Cannot login as owner
**Check these:**
1. Owner user exists: `python scripts/create_owner.py`
2. Correct credentials: Email: `doudous6666@gmail.com`, Password: `123456789`
3. Server is running: `python run.py`

## 📊 User Hierarchy

```
OWNER (Superuser)
├── Cannot be edited/deleted by anyone else
├── Has all privileges
└── Can manage all users

ADMIN
├── Can manage users (except owner)
├── Can view admin dashboard
└── Cannot edit/delete owner

MANAGER  
├── Can manage some users
├── Can create questions
└── Cannot edit/delete owner

STUDENT
├── Basic user access
└── May require payment for premium features
```

## 🚀 API Testing

### Login as Owner
```bash
curl -X POST "http://localhost:8000/auth/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "username=owner&password=123456789"
```

### Test Admin Dashboard (with owner token)
```bash
curl -X GET "http://localhost:8000/admin/dashboard" \
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Migration Notes

If you're upgrading from an old version:

1. **Backup first:** `cp mcq_study.db mcq_study_backup.db`
2. **Use reset script:** `python scripts/reset_database.py`
3. **Re-create owner:** Owner will be created automatically during reset
4. **Import old data:** You'll need to manually migrate your questions/answers if needed

## 🆘 Getting Help

If you encounter issues:

1. Check the console output for error messages
2. Verify all dependencies are installed: `pip install -r requirements.txt`
3. Make sure you're in the `backend` directory when running commands
4. Check the database file exists: `ls -la mcq_study.db`
5. Review the application logs when starting: `python run.py`