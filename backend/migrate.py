#!/usr/bin/env python3
"""
Database migration script for MCQ Study App.
This script helps you run database migrations using Alembic.
"""

import subprocess
import sys
import os

def run_command(command):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Main migration function"""
    print("🔄 MCQ Study App Database Migration")
    print("=" * 40)
    
    # Check if alembic is installed
    try:
        import alembic
    except ImportError:
        print("❌ Alembic is not installed. Installing...")
        if not run_command("pip install alembic"):
            print("Failed to install Alembic. Please install it manually: pip install alembic")
            return
    
    # Initialize Alembic if not already initialized
    if not os.path.exists("alembic/versions"):
        print("📁 Initializing Alembic...")
        if not run_command("alembic init alembic"):
            print("Failed to initialize Alembic")
            return
    
    # Run migrations
    print("🚀 Running database migrations...")
    if run_command("alembic upgrade head"):
        print("✅ Database migration completed successfully!")
    else:
        print("❌ Database migration failed!")
        return
    
    print("\n🎉 Migration completed! You can now:")
    print("1. Start the server: python run.py")
    print("2. Seed the database: python scripts/seed_data.py")
    print("3. Test the API: python test_api.py")

if __name__ == "__main__":
    main() 