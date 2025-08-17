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

def get_question_by_details(db: Session, year: int, course: str, number: int):
    """Get a question by year, course, and number (for duplicate checking)"""
    return db.query(models.Question).filter(
        models.Question.year == year,
        models.Question.course == course,
        models.Question.number == number
    ).first()

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
    from datetime import timedelta
    
    db_key = db.query(models.ActivationKey).filter(
        models.ActivationKey.key == key,
        models.ActivationKey.is_used == False
    ).first()
    
    if not db_key:
        return None
    
    # Mark key as used and set expiration to 1 year from now
    activation_time = datetime.utcnow()
    db_key.is_used = True
    db_key.user_id = user_id
    db_key.used_at = activation_time
    db_key.expires_at = activation_time + timedelta(days=365)  # 1 year from activation
    
    # Update user payment status
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_paid = True
    
    db.commit()
    db.refresh(db_key)
    return db_key

def is_user_activation_valid(db: Session, user_id: int) -> bool:
    """Check if user's activation is still valid (not expired)"""
    user_key = db.query(models.ActivationKey).filter(
        models.ActivationKey.user_id == user_id,
        models.ActivationKey.is_used == True
    ).first()
    
    if not user_key or not user_key.expires_at:
        return False
    
    return datetime.utcnow() < user_key.expires_at

# Device Session CRUD operations
def get_user_device_sessions(db: Session, user_id: int):
    """Get all active device sessions for a user"""
    return db.query(models.DeviceSession).filter(
        models.DeviceSession.user_id == user_id,
        models.DeviceSession.is_active == True
    ).all()

def create_device_session(db: Session, user_id: int, device_session: schemas.DeviceSessionCreate):
    """Create a new device session"""
    # Check if user already has 2 active devices
    active_sessions = get_user_device_sessions(db, user_id)
    if len(active_sessions) >= 2:
        # Deactivate the oldest session
        oldest_session = min(active_sessions, key=lambda x: x.last_seen)
        oldest_session.is_active = False
    
    # Check if device already exists
    existing_session = db.query(models.DeviceSession).filter(
        models.DeviceSession.user_id == user_id,
        models.DeviceSession.device_fingerprint == device_session.device_fingerprint
    ).first()
    
    if existing_session:
        # Reactivate existing session
        existing_session.is_active = True
        existing_session.last_seen = datetime.utcnow()
        db.commit()
        db.refresh(existing_session)
        return existing_session
    
    # Create new session
    db_session = models.DeviceSession(
        user_id=user_id,
        device_fingerprint=device_session.device_fingerprint,
        device_name=device_session.device_name,
        last_seen=datetime.utcnow()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def update_device_last_seen(db: Session, user_id: int, device_fingerprint: str):
    """Update last seen time for a device"""
    device_session = db.query(models.DeviceSession).filter(
        models.DeviceSession.user_id == user_id,
        models.DeviceSession.device_fingerprint == device_fingerprint,
        models.DeviceSession.is_active == True
    ).first()
    
    if device_session:
        device_session.last_seen = datetime.utcnow()
        db.commit()
        db.refresh(device_session)
    
    return device_session

def deactivate_device_session(db: Session, user_id: int, device_id: int):
    """Deactivate a specific device session"""
    device_session = db.query(models.DeviceSession).filter(
        models.DeviceSession.id == device_id,
        models.DeviceSession.user_id == user_id
    ).first()
    
    if device_session:
        device_session.is_active = False
        db.commit()
        return True
    return False

# Password change function
def change_user_password(db: Session, email: str, current_password: str, new_password: str) -> bool:
    """Change user password after verifying current password"""
    user = get_user_by_email(db, email)
    if not user:
        return False
    
    # Verify current password
    if not auth.verify_password(current_password, user.hashed_password):
        return False
    
    # Update password
    user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    return True