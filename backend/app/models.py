from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

# Association table for many-to-many relationship between questions and correct answers
question_correct_answers = Table(
    'question_correct_answers',
    Base.metadata,
    Column('question_id', Integer, ForeignKey('questions.id')),
    Column('answer_id', Integer, ForeignKey('answers.id'))
)

class UserType(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    user_type = Column(Enum(UserType), default=UserType.STUDENT)
    is_paid = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, index=True)
    course = Column(String, index=True)
    number = Column(Integer)
    question_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    answers = relationship("Answer", back_populates="question")
    correct_answers = relationship("Answer", secondary=question_correct_answers)

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer_text = Column(Text)
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    question = relationship("Question", back_populates="answers") 