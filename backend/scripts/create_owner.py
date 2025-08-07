#!/usr/bin/env python3
"""
Enhanced script to create the owner user in the database.
This script ensures only one owner exists and validates the setup.
"""
import sys
import os
import sqlite3

# Add the parent directory to the Python path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models, crud
from app.models import UserType
from app.auth import get_password_hash
from app.schemas import UserCreate

def validate_database():
    """Ensure database tables exist"""
    print("🔍 Validating database structure...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✅ Database tables validated/created")
        return True
    except Exception as e:
        print(f"❌ Database validation failed: {e}")
        return False

def check_existing_owners():
    """Check for any existing owner users"""
    db = SessionLocal()
    try:
        owners = db.query(models.User).filter(
            models.User.user_type == UserType.OWNER
        ).all()
        
        if owners:
            print(f"⚠️  Found {len(owners)} existing owner user(s):")
            for owner in owners:
                print(f"   ID: {owner.id}, Email: {owner.email}, Username: {owner.username}")
            return owners
        else:
            print("ℹ️  No existing owner users found")
            return []
    except Exception as e:
        print(f"❌ Error checking existing owners: {e}")
        return []
    finally:
        db.close()

def create_owner_user():
    """Create the owner user if it doesn't exist, with enhanced validation"""
    if not validate_database():
        return None
    
    existing_owners = check_existing_owners()
    
    # If owner exists, ask what to do
    if existing_owners:
        print("\n🤔 What would you like to do?")
        print("1. Keep existing owner (recommended)")
        print("2. Delete existing owner(s) and create new one")
        print("3. Cancel")
        
        choice = input("Enter your choice (1-3): ").strip()
        
        if choice == "1":
            owner = existing_owners[0]  # Use first owner
            print(f"✅ Using existing owner: {owner.email}")
            return owner
        elif choice == "2":
            # Delete existing owners
            db = SessionLocal()
            try:
                for owner in existing_owners:
                    db.delete(owner)
                db.commit()
                print("✅ Existing owner(s) deleted")
            except Exception as e:
                print(f"❌ Error deleting existing owners: {e}")
                db.rollback()
                return None
            finally:
                db.close()
        else:
            print("❌ Operation cancelled")
            return None
    
    # Create new owner user
    db = SessionLocal()
    try:
        print("🔄 Creating new owner user...")
        
        # Final check to ensure no owner exists
        final_check = db.query(models.User).filter(
            models.User.user_type == UserType.OWNER
        ).first()
        
        if final_check:
            print("❌ Owner user already exists after deletion attempt")
            return None
        
        # Create owner user
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
        print(f"   ID: {owner_user.id}")
        print(f"   Email: {owner_user.email}")
        print(f"   Username: {owner_user.username}")
        print(f"   Type: {owner_user.user_type.value}")
        print(f"   Password: 123456789")
        
        # Verify creation
        verify_owner_creation()
        
        return owner_user
        
    except Exception as e:
        print(f"❌ Error creating owner user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def verify_owner_creation():
    """Verify the owner user was created correctly and permissions work"""
    print("\n🔍 Verifying owner creation and permissions...")
    
    try:
        # Use raw SQL to double-check
        conn = sqlite3.connect('mcq_study.db')
        cursor = conn.cursor()
        
        # Check owner exists (SQLAlchemy stores enum as uppercase)
        cursor.execute("SELECT id, email, username, user_type, is_paid FROM users WHERE user_type = 'OWNER';")
        owners = cursor.fetchall()
        
        if len(owners) != 1:
            print(f"❌ Expected 1 owner, found {len(owners)}")
            return False
        
        owner = owners[0]
        print(f"✅ Owner verified: ID={owner[0]}, Email={owner[1]}, Username={owner[2]}")
        
        # Check is_paid status
        if owner[4] != 1:
            print("❌ Owner is_paid should be True")
            return False
        
        print("✅ Owner is_paid status correct")
        
        conn.close()
        print("✅ Owner creation verification completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Owner verification failed: {e}")
        return False

def show_usage_instructions():
    """Show instructions for using the owner account"""
    print("\n📋 OWNER ACCOUNT USAGE:")
    print("=" * 30)
    print("Email: doudous6666@gmail.com")
    print("Password: 123456789")
    print("")
    print("🔒 OWNER PRIVILEGES:")
    print("• Cannot be edited by other users")
    print("• Cannot be deleted by other users")  
    print("• Has all admin and manager permissions")
    print("• Bypasses payment requirements")
    print("• Can manage all other users")
    print("")
    print("⚠️  IMPORTANT SECURITY NOTES:")
    print("• Change the default password after first login")
    print("• Only one owner account should exist")
    print("• Owner account has highest privileges")

if __name__ == "__main__":
    print("🚀 MCQ Study App - Owner User Creation")
    print("=" * 40)
    
    owner = create_owner_user()
    
    if owner:
        show_usage_instructions()
        print("\n🎉 Owner setup completed successfully!")
    else:
        print("\n❌ Owner setup failed. Please check the errors above.")