from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional

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
        hashed_password=hashed_password
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

def get_questions(db: Session, skip: int = 0, limit: int = 100, year: Optional[int] = None, course: Optional[str] = None):
    query = db.query(models.Question)
    
    if year:
        query = query.filter(models.Question.year == year)
    if course:
        query = query.filter(models.Question.course.ilike(f"%{course}%"))
    
    return query.offset(skip).limit(limit).all()

def create_question(db: Session, question: schemas.QuestionCreate):
    db_question = models.Question(
        year=question.year,
        course=question.course,
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
            is_correct=answer_data.is_correct
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
                is_correct=answer_data.is_correct
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
        is_correct=answer.is_correct
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer