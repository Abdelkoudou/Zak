#!/usr/bin/env python3
"""
Complete Reset Script for MCQ Study App
This script completely resets the database and recreates the owner user.
"""
import sys
import os
from pathlib import Path

# Add the parent directory to the Python path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    """Main function to perform complete reset"""
    print("🔄 Starting complete database reset...")
    print("=" * 50)
    
    # Import and run the existing reset_database script
    try:
        from reset_database import main as reset_main
        reset_main()
        print("\n✅ Complete reset finished successfully!")
        print("=" * 50)
        print("📋 SUMMARY:")
        print("- Database completely reset")
        print("- Owner user created")
        print("- Ready for use")
        print("\n🚀 You can now:")
        print("1. Start the server: python run.py")
        print("2. Access the frontend: http://localhost:3000")
        print("3. Login as owner with email: doudous6666@gmail.com, password: 123456789")
        
    except ImportError as e:
        print(f"❌ Error importing reset_database module: {e}")
        print("Make sure you're running this from the backend directory")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Confirm with user
    print("⚠️  WARNING: This will completely delete all data!")
    print("This includes:")
    print("- All users (except owner)")
    print("- All questions")
    print("- All answers")
    print("- All device sessions")
    print("- All activation keys")
    
    confirm = input("\nAre you sure you want to continue? (type 'yes' to confirm): ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
        sys.exit(0)
    
    main()