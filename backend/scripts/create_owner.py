#!/usr/bin/env python3
"""
Script to create the owner user in the database.
"""
import sys
import os

# Add the parent directory to the Python path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models, crud
from app.models import UserType
from app.auth import get_password_hash
from app.schemas import UserCreate

def create_owner_user():
    """Create the owner user if it doesn't exist"""
    db = SessionLocal()
    
    try:
        # Check if owner already exists
        existing_owner = db.query(models.User).filter(
            models.User.email == "doudous6666@gmail.com"
        ).first()
        
        if existing_owner:
            print("Owner user already exists!")
            print(f"ID: {existing_owner.id}")
            print(f"Email: {existing_owner.email}")
            print(f"Username: {existing_owner.username}")
            print(f"Type: {existing_owner.user_type.value}")
            return existing_owner
        
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
        
        print("Owner user created successfully!")
        print(f"ID: {owner_user.id}")
        print(f"Email: {owner_user.email}")
        print(f"Username: {owner_user.username}")
        print(f"Type: {owner_user.user_type.value}")
        print(f"Password: 123456789")
        
        return owner_user
        
    except Exception as e:
        print(f"Error creating owner user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    create_owner_user()