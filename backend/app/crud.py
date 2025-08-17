from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime

from . import models, schemas, auth

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        year_of_study=user.year_of_study,
        speciality=user.speciality
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Handle password hashing if password is being updated
    if 'password' in update_data:
        update_data['hashed_password'] = auth.get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True

# Question CRUD operations
def get_question(db: Session, question_id: int):
    return db.query(models.Question).filter(models.Question.id == question_id).first()

def get_questions(db: Session, skip: int = 0, limit: int = 100, year: Optional[int] = None, course: Optional[str] = None, speciality: Optional[str] = None, chapter: Optional[str] = None):
    query = db.query(models.Question)
    
    if year:
        query = query.filter(models.Question.year == year)
    if course:
        query = query.filter(models.Question.course.ilike(f"%{course}%"))
    if speciality:
        query = query.filter(models.Question.speciality.ilike(f"%{speciality}%"))
    if chapter:
        query = query.filter(models.Question.chapter.ilike(f"%{chapter}%"))
    
    return query.offset(skip).limit(limit).all()

def create_question(db: Session, question: schemas.QuestionCreate):
    db_question = models.Question(
        year=question.year,
        course=question.course,
        speciality=question.speciality,
        chapter=question.chapter,
        number=question.number,
        question_text=question.question_text
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    # Create answers
    for answer_data in question.answers:
        db_answer = models.Answer(
            question_id=db_question.id,
            answer_text=answer_data.answer_text,
            is_correct=answer_data.is_correct,
            option_label=answer_data.option_label
        )
        db.add(db_answer)
    
    db.commit()
    db.refresh(db_question)
    return db_question

def update_question(db: Session, question_id: int, question_update: schemas.QuestionUpdate):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return None
    
    update_data = question_update.model_dump(exclude_unset=True)
    
    # Handle answers separately
    answers_data = update_data.pop('answers', None)
    
    # Update question fields
    for field, value in update_data.items():
        setattr(db_question, field, value)
    
    # Update answers if provided
    if answers_data is not None:
        # Delete existing answers
        db.query(models.Answer).filter(models.Answer.question_id == question_id).delete()
        
        # Create new answers
        for answer_data in answers_data:
            db_answer = models.Answer(
                question_id=question_id,
                answer_text=answer_data.answer_text,
                is_correct=answer_data.is_correct,
                option_label=answer_data.option_label
            )
            db.add(db_answer)
    
    db.commit()
    db.refresh(db_question)
    return db_question

def delete_question(db: Session, question_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return False
    
    # Delete associated answers first
    db.query(models.Answer).filter(models.Answer.question_id == question_id).delete()
    
    # Delete question
    db.delete(db_question)
    db.commit()
    return True

# Answer CRUD operations
def get_answer(db: Session, answer_id: int):
    return db.query(models.Answer).filter(models.Answer.id == answer_id).first()

def get_answers_by_question(db: Session, question_id: int):
    return db.query(models.Answer).filter(models.Answer.question_id == question_id).all()

def create_answer(db: Session, answer: schemas.AnswerCreate, question_id: int):
    db_answer = models.Answer(
        question_id=question_id,
        answer_text=answer.answer_text,
        is_correct=answer.is_correct,
        option_label=answer.option_label
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

# Activation Key CRUD operations
import secrets
import string

def generate_activation_key() -> str:
    """Generate a unique activation key"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(16))

def create_activation_key(db: Session, created_by: int):
    key = generate_activation_key()
    # Ensure key is unique
    while db.query(models.ActivationKey).filter(models.ActivationKey.key == key).first():
        key = generate_activation_key()
    
    db_key = models.ActivationKey(
        key=key,
        created_by=created_by
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    return db_key

def get_activation_key(db: Session, key: str):
    return db.query(models.ActivationKey).filter(models.ActivationKey.key == key).first()

def get_activation_keys(db: Session, skip: int = 0, limit: int = 100, is_used: Optional[bool] = None):
    query = db.query(models.ActivationKey)
    if is_used is not None:
        query = query.filter(models.ActivationKey.is_used == is_used)
    return query.offset(skip).limit(limit).all()

def use_activation_key(db: Session, key: str, user_id: int):
    db_key = db.query(models.ActivationKey).filter(
        models.ActivationKey.key == key,
        models.ActivationKey.is_used == False
    ).first()
    
    if not db_key:
        return None
    
    # Mark key as used
    db_key.is_used = True
    db_key.user_id = user_id
    db_key.used_at = datetime.utcnow()
    
    # Update user payment status
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_paid = True
    
    db.commit()
    db.refresh(db_key)
    return db_key