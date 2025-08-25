#!/usr/bin/env python3
"""
Complete Reset Script for French Medical Education Structure
This script completely resets the database with the new French structure.
"""
import sys
import os
from pathlib import Path

# Add the parent directory to the Python path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, get_db
from app.models import Base, User, UserType
from app import auth
import sqlalchemy

def reset_database():
    """Drop all tables and recreate them"""
    print("🗑️  Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ All tables dropped")
    
    print("🏗️  Creating new table structure...")
    Base.metadata.create_all(bind=engine)
    print("✅ New table structure created")

def create_owner_user():
    """Create the default owner user"""
    print("👤 Creating owner user...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if owner already exists
        owner = db.query(User).filter(User.user_type == UserType.OWNER).first()
        if owner:
            print("⚠️  Owner user already exists")
            return owner
        
        # Create owner user
        hashed_password = auth.get_password_hash("123456789")
        owner_user = User(
            email="doudous6666@gmail.com",
            username="owner",
            hashed_password=hashed_password,
            user_type=UserType.OWNER,
            is_paid=True
        )
        
        db.add(owner_user)
        db.commit()
        db.refresh(owner_user)
        
        print("✅ Owner user created successfully")
        print(f"   Email: {owner_user.email}")
        print(f"   Username: {owner_user.username}")
        print(f"   Password: 123456789")
        print(f"   User Type: {owner_user.user_type}")
        
        return owner_user
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def create_sample_questions():
    """Create some sample questions with the new structure"""
    print("📝 Creating sample questions...")
    
    db = next(get_db())
    
    try:
        from app.models import Question, Answer
        
        # Sample 1st year question
        question1 = Question(
            year=2024,
            study_year=1,
            module="Anatomie",
            unite=None,
            speciality="Médecine",
            cours="Anatomie générale",
            exam_type="EMD1",
            number=1,
            question_text="Qu'est-ce que l'anatomie?",
            question_image=None
        )
        db.add(question1)
        db.commit()
        db.refresh(question1)
        
        # Add answers for question 1
        answers1 = [
            Answer(question_id=question1.id, answer_text="L'étude de la structure du corps", is_correct=True, option_label="a"),
            Answer(question_id=question1.id, answer_text="L'étude des fonctions", is_correct=False, option_label="b"),
            Answer(question_id=question1.id, answer_text="L'étude des maladies", is_correct=False, option_label="c"),
            Answer(question_id=question1.id, answer_text="L'étude des médicaments", is_correct=False, option_label="d"),
            Answer(question_id=question1.id, answer_text="Aucune des réponses", is_correct=False, option_label="e")
        ]
        
        for answer in answers1:
            db.add(answer)
        
        # Sample 2nd year question with unite
        question2 = Question(
            year=2024,
            study_year=2,
            module="Anatomie",
            unite="Appareil Cardio-vasculaire et Respiratoire",
            speciality="Médecine",
            cours="Anatomie cardiaque",
            exam_type="EMD",
            number=1,
            question_text="Combien de cavités a le cœur?",
            question_image=None
        )
        db.add(question2)
        db.commit()
        db.refresh(question2)
        
        # Add answers for question 2
        answers2 = [
            Answer(question_id=question2.id, answer_text="2", is_correct=False, option_label="a"),
            Answer(question_id=question2.id, answer_text="3", is_correct=False, option_label="b"),
            Answer(question_id=question2.id, answer_text="4", is_correct=True, option_label="c"),
            Answer(question_id=question2.id, answer_text="5", is_correct=False, option_label="d"),
            Answer(question_id=question2.id, answer_text="6", is_correct=False, option_label="e")
        ]
        
        for answer in answers2:
            db.add(answer)
        
        db.commit()
        print("✅ Sample questions created")
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def main():
    """Main function to perform complete reset"""
    print("🔄 Starting French medical education database reset...")
    print("=" * 60)
    
    try:
        # Reset database
        reset_database()
        
        # Create owner user
        create_owner_user()
        
        # Create sample questions
        create_sample_questions()
        
        print("\n✅ Reset completed successfully!")
        print("=" * 60)
        print("📋 SUMMARY:")
        print("- Database completely reset with French structure")
        print("- Owner user created")
        print("- Sample questions added")
        print("- Ready for use")
        print("\n🚀 You can now:")
        print("1. Start the server: python run.py")
        print("2. Access the frontend: http://localhost:3000")
        print("3. Login as owner with email: doudous6666@gmail.com, password: 123456789")
        
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Confirm with user
    print("⚠️  WARNING: This will completely delete all data!")
    print("This includes:")
    print("- All users (except the new owner)")
    print("- All questions")
    print("- All answers")
    print("- All device sessions")
    print("- All activation keys")
    print("\nThe new database will have:")
    print("- French medical education structure")
    print("- New fields: study_year, module, unite, cours, exam_type")
    print("- Image support for questions and answers")
    
    confirm = input("\nAre you sure you want to continue? (type 'yes' to confirm): ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
        sys.exit(0)
    
    main()