#!/usr/bin/env python3
"""
Complete database reset script for MCQ Study App.
This script will completely reset the database and allow you to start fresh.
"""
import sys
import os
import sqlite3
from pathlib import Path

# Add the parent directory to the Python path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models
from app.models import UserType
from app.auth import get_password_hash

def backup_database():
    """Create a backup of the current database"""
    db_path = Path("mcq_study.db")
    if db_path.exists():
        import datetime
        backup_name = f"mcq_study_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        backup_path = Path("backups") / backup_name
        backup_path.parent.mkdir(exist_ok=True)
        
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ Database backed up to: {backup_path}")
        return backup_path
    else:
        print("ℹ️  No existing database found, skipping backup")
        return None

def delete_database():
    """Delete the existing database file"""
    db_path = Path("mcq_study.db")
    if db_path.exists():
        db_path.unlink()
        print("✅ Old database deleted")
    else:
        print("ℹ️  No database file found")

def recreate_database():
    """Recreate all database tables"""
    print("🔄 Creating new database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def create_initial_owner():
    """Create the initial owner user"""
    db = SessionLocal()
    
    try:
        # Check if any owner already exists
        existing_owner = db.query(models.User).filter(
            models.User.user_type == UserType.OWNER
        ).first()
        
        if existing_owner:
            print(f"⚠️  Owner user already exists: {existing_owner.email}")
            return existing_owner
        
        # Create the owner user
        owner_user = models.User(
            email="doudous6666@gmail.com",
            username="owner",
            hashed_password=get_password_hash("123456789"),
            user_type=UserType.OWNER,
            is_paid=True  # Owner is always paid
        )
        
        db.add(owner_user)
        db.commit()
        db.refresh(owner_user)
        
        print("✅ Owner user created successfully!")
        print(f"   Email: {owner_user.email}")
        print(f"   Username: {owner_user.username}")
        print(f"   Password: 123456789")
        print(f"   User Type: {owner_user.user_type.value}")
        
        return owner_user
        
    except Exception as e:
        print(f"❌ Error creating owner user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def verify_database():
    """Verify the database is properly set up"""
    print("\n🔍 Verifying database setup...")
    
    try:
        conn = sqlite3.connect('mcq_study.db')
        cursor = conn.cursor()
        
        # Check tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        expected_tables = ['users', 'questions', 'answers', 'question_correct_answers']
        
        missing_tables = set(expected_tables) - set(tables)
        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
            return False
        
        # Check owner user exists (SQLAlchemy stores enum as uppercase)
        cursor.execute("SELECT id, email, username, user_type FROM users WHERE user_type = 'OWNER';")
        owners = cursor.fetchall()
        
        if not owners:
            print("❌ No owner user found")
            return False
        elif len(owners) > 1:
            print(f"⚠️  Multiple owners found: {len(owners)} (should only be 1)")
        else:
            owner = owners[0]
            print(f"✅ Owner user verified: ID={owner[0]}, Email={owner[1]}, Username={owner[2]}")
        
        conn.close()
        print("✅ Database verification completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False

def main():
    """Main function to reset the database"""
    print("🚨 MCQ STUDY APP - COMPLETE DATABASE RESET")
    print("=" * 50)
    print("⚠️  WARNING: This will DELETE ALL your existing data!")
    print("Make sure you really want to do this.")
    print("")
    
    # Ask for confirmation
    response = input("Type 'YES' to confirm database reset: ").strip()
    if response != 'YES':
        print("❌ Database reset cancelled")
        return
    
    print("\n🔄 Starting database reset process...")
    
    # Step 1: Backup existing database
    print("\n1️⃣  Backing up existing database...")
    backup_path = backup_database()
    
    # Step 2: Delete old database
    print("\n2️⃣  Deleting old database...")
    delete_database()
    
    # Step 3: Recreate database tables
    print("\n3️⃣  Creating new database...")
    recreate_database()
    
    # Step 4: Create initial owner
    print("\n4️⃣  Creating owner user...")
    owner = create_initial_owner()
    
    if not owner:
        print("❌ Failed to create owner user. Database reset incomplete.")
        return
    
    # Step 5: Verify everything is working
    print("\n5️⃣  Verifying database...")
    if not verify_database():
        print("❌ Database verification failed")
        return
    
    print("\n🎉 DATABASE RESET COMPLETED SUCCESSFULLY!")
    print("=" * 50)
    print("✅ Your database has been completely reset and is ready to use.")
    print("")
    print("📋 OWNER LOGIN CREDENTIALS:")
    print(f"   Email: doudous6666@gmail.com")
    print(f"   Password: 123456789")
    print("")
    print("🚀 NEXT STEPS:")
    print("1. Start the server: python run.py")
    print("2. Test the owner login")
    print("3. Optionally add sample data: python scripts/seed_data.py")
    
    if backup_path:
        print(f"4. Your old data is backed up at: {backup_path}")
    
    print("\n⚠️  IMPORTANT: Change the owner password after first login!")

if __name__ == "__main__":
    main()