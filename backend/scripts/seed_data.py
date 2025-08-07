#!/usr/bin/env python3
"""
Script to seed the database with sample questions for testing.
Run this after setting up the database to populate it with sample data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Question, Answer
from app.crud import create_user
from app.schemas import UserCreate

def seed_users():
    """Create sample users"""
    db = SessionLocal()
    try:
        # Create admin user
        admin_data = UserCreate(
            email="admin@example.com",
            username="admin",
            password="admin123",
            user_type="admin"
        )
        admin = create_user(db, admin_data)
        admin.is_paid = True
        db.commit()
        print(f"Created admin user: {admin.username}")
        
        # Create manager user
        manager_data = UserCreate(
            email="manager@example.com",
            username="manager",
            password="manager123",
            user_type="manager"
        )
        manager = create_user(db, manager_data)
        manager.is_paid = True
        db.commit()
        print(f"Created manager user: {manager.username}")
        
        # Create a regular student user
        student_data = UserCreate(
            email="student@example.com",
            username="student1",
            password="password123",
            user_type="student"
        )
        student = create_user(db, student_data)
        print(f"Created student user: {student.username}")
        
        # Create a paid student user
        paid_student_data = UserCreate(
            email="paid_student@example.com",
            username="paid_student",
            password="password123",
            user_type="student"
        )
        paid_student = create_user(db, paid_student_data)
        paid_student.is_paid = True
        db.commit()
        print(f"Created paid student user: {paid_student.username}")
        
    except Exception as e:
        print(f"Error creating users: {e}")
    finally:
        db.close()

def seed_questions():
    """Create sample questions"""
    db = SessionLocal()
    try:
        # Sample questions data
        questions_data = [
            {
                "year": 2023,
                "course": "Mathematics",
                "number": 1,
                "question_text": "What is the value of π (pi) to two decimal places?",
                "answers": [
                    {"answer_text": "3.12", "is_correct": False},
                    {"answer_text": "3.14", "is_correct": True},
                    {"answer_text": "3.16", "is_correct": False},
                    {"answer_text": "3.18", "is_correct": False}
                ]
            },
            {
                "year": 2023,
                "course": "Mathematics",
                "number": 2,
                "question_text": "What is the square root of 16?",
                "answers": [
                    {"answer_text": "2", "is_correct": False},
                    {"answer_text": "4", "is_correct": True},
                    {"answer_text": "8", "is_correct": False},
                    {"answer_text": "16", "is_correct": False}
                ]
            },
            {
                "year": 2023,
                "course": "Physics",
                "number": 1,
                "question_text": "What is the SI unit of force?",
                "answers": [
                    {"answer_text": "Joule", "is_correct": False},
                    {"answer_text": "Watt", "is_correct": False},
                    {"answer_text": "Newton", "is_correct": True},
                    {"answer_text": "Pascal", "is_correct": False}
                ]
            },
            {
                "year": 2023,
                "course": "Physics",
                "number": 2,
                "question_text": "Which of the following is a vector quantity?",
                "answers": [
                    {"answer_text": "Mass", "is_correct": False},
                    {"answer_text": "Temperature", "is_correct": False},
                    {"answer_text": "Velocity", "is_correct": True},
                    {"answer_text": "Time", "is_correct": False}
                ]
            },
            {
                "year": 2022,
                "course": "Chemistry",
                "number": 1,
                "question_text": "What is the chemical symbol for gold?",
                "answers": [
                    {"answer_text": "Ag", "is_correct": False},
                    {"answer_text": "Au", "is_correct": True},
                    {"answer_text": "Fe", "is_correct": False},
                    {"answer_text": "Cu", "is_correct": False}
                ]
            },
            {
                "year": 2022,
                "course": "Chemistry",
                "number": 2,
                "question_text": "What is the atomic number of carbon?",
                "answers": [
                    {"answer_text": "4", "is_correct": False},
                    {"answer_text": "6", "is_correct": True},
                    {"answer_text": "8", "is_correct": False},
                    {"answer_text": "12", "is_correct": False}
                ]
            },
            {
                "year": 2022,
                "course": "Biology",
                "number": 1,
                "question_text": "What is the powerhouse of the cell?",
                "answers": [
                    {"answer_text": "Nucleus", "is_correct": False},
                    {"answer_text": "Mitochondria", "is_correct": True},
                    {"answer_text": "Endoplasmic reticulum", "is_correct": False},
                    {"answer_text": "Golgi apparatus", "is_correct": False}
                ]
            },
            {
                "year": 2022,
                "course": "Biology",
                "number": 2,
                "question_text": "Which of the following is NOT a type of blood cell?",
                "answers": [
                    {"answer_text": "Red blood cell", "is_correct": False},
                    {"answer_text": "White blood cell", "is_correct": False},
                    {"answer_text": "Platelet", "is_correct": False},
                    {"answer_text": "Neuron", "is_correct": True}
                ]
            }
        ]
        
        for q_data in questions_data:
            # Create question
            question = Question(
                year=q_data["year"],
                course=q_data["course"],
                number=q_data["number"],
                question_text=q_data["question_text"]
            )
            db.add(question)
            db.commit()
            db.refresh(question)
            
            # Create answers
            for a_data in q_data["answers"]:
                answer = Answer(
                    question_id=question.id,
                    answer_text=a_data["answer_text"],
                    is_correct=a_data["is_correct"]
                )
                db.add(answer)
            
            db.commit()
            print(f"Created question: {question.course} {question.year} - Q{question.number}")
        
    except Exception as e:
        print(f"Error creating questions: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main function to seed the database"""
    print("Starting database seeding...")
    
    print("\n1. Creating users...")
    seed_users()
    
    print("\n2. Creating questions...")
    seed_questions()
    
    print("\nDatabase seeding completed!")

if __name__ == "__main__":
    main() 