#!/usr/bin/env python3
"""
MCQ Questions Import Script

This script imports questions from JSON files created by the offline question entry tool
into the MCQ Study App database.

Usage:
    python import_questions.py <json_file_path>
    python import_questions.py questions.json

Features:
- Validates question format before import
- Handles duplicate questions gracefully
- Provides detailed import statistics
- Supports batch import of multiple files
"""

import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Add the parent directory to Python path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models, crud, schemas


def validate_question_data(question_data: Dict[str, Any]) -> bool:
    """Validate that question data has all required fields."""
    required_fields = ['year', 'course', 'speciality', 'chapter', 'number', 'question_text', 'answers']
    
    for field in required_fields:
        if field not in question_data:
            print(f"  ❌ Missing required field: {field}")
            return False
    
    # Validate answers
    if not isinstance(question_data['answers'], list) or len(question_data['answers']) < 2:
        print("  ❌ Must have at least 2 answers")
        return False
    
    # Check if at least one answer is marked as correct
    has_correct = any(answer.get('is_correct', False) for answer in question_data['answers'])
    if not has_correct:
        print("  ❌ Must have at least one correct answer")
        return False
    
    # Validate answer structure
    for i, answer in enumerate(question_data['answers']):
        if not isinstance(answer, dict):
            print(f"  ❌ Answer {i+1} is not a valid object")
            return False
        
        if 'answer_text' not in answer or 'option_label' not in answer:
            print(f"  ❌ Answer {i+1} missing required fields")
            return False
        
        if 'is_correct' not in answer:
            answer['is_correct'] = False  # Default to false if not specified
    
    return True


def import_questions_from_file(file_path: str) -> Dict[str, int]:
    """Import questions from a JSON file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    print(f"\n📁 Loading questions from: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            questions_data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")
    
    if not isinstance(questions_data, list):
        raise ValueError("JSON file must contain an array of questions")
    
    print(f"📊 Found {len(questions_data)} questions in file")
    
    db = SessionLocal()
    stats = {
        'total': len(questions_data),
        'imported': 0,
        'skipped': 0,
        'errors': 0
    }
    
    try:
        for i, question_data in enumerate(questions_data, 1):
            print(f"\n🔄 Processing question {i}/{len(questions_data)}")
            print(f"   📝 {question_data.get('course', 'Unknown')} - Q{question_data.get('number', '?')}")
            
            # Validate question data
            if not validate_question_data(question_data):
                print(f"   ⚠️  Skipping invalid question")
                stats['errors'] += 1
                continue
            
            # Check for duplicate
            existing = db.query(models.Question).filter(
                models.Question.year == question_data['year'],
                models.Question.course == question_data['course'],
                models.Question.number == question_data['number']
            ).first()
            
            if existing:
                print(f"   ⚠️  Question already exists, skipping")
                stats['skipped'] += 1
                continue
            
            try:
                # Create question schema
                question_create = schemas.QuestionCreate(
                    year=question_data['year'],
                    course=question_data['course'],
                    speciality=question_data['speciality'],
                    chapter=question_data['chapter'],
                    number=question_data['number'],
                    question_text=question_data['question_text'],
                    answers=[
                        schemas.AnswerCreate(
                            answer_text=answer['answer_text'],
                            is_correct=answer.get('is_correct', False),
                            option_label=answer['option_label']
                        )
                        for answer in question_data['answers']
                    ]
                )
                
                # Import the question
                imported_question = crud.create_question(db, question_create)
                print(f"   ✅ Successfully imported (ID: {imported_question.id})")
                stats['imported'] += 1
                
            except Exception as e:
                print(f"   ❌ Error importing question: {e}")
                stats['errors'] += 1
                db.rollback()
    
    finally:
        db.close()
    
    return stats


def print_import_summary(stats: Dict[str, int], file_path: str):
    """Print a summary of the import operation."""
    print("\n" + "="*60)
    print("📊 IMPORT SUMMARY")
    print("="*60)
    print(f"📁 File: {os.path.basename(file_path)}")
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📈 Total questions in file: {stats['total']}")
    print(f"✅ Successfully imported: {stats['imported']}")
    print(f"⚠️  Skipped (duplicates): {stats['skipped']}")
    print(f"❌ Errors: {stats['errors']}")
    
    if stats['imported'] > 0:
        print(f"\n🎉 Import completed successfully!")
        print(f"💡 Tip: You can now view the questions in the main application")
    elif stats['skipped'] == stats['total']:
        print(f"\n⚠️  All questions were already in the database")
    else:
        print(f"\n⚠️  Import completed with issues")


def main():
    """Main function."""
    if len(sys.argv) != 2:
        print("Usage: python import_questions.py <json_file_path>")
        print("Example: python import_questions.py questions.json")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    print("🚀 MCQ Questions Import Tool")
    print("="*40)
    
    try:
        stats = import_questions_from_file(file_path)
        print_import_summary(stats, file_path)
        
        if stats['errors'] > 0:
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()