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
    OWNER = "owner"
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
    year_of_study = Column(Integer, nullable=True)  # For students
    speciality = Column(String, nullable=True)  # For students
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships - specify foreign_keys to avoid ambiguity
    activation_keys = relationship("ActivationKey", back_populates="user", foreign_keys="ActivationKey.user_id")
    device_sessions = relationship("DeviceSession", back_populates="user")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, index=True)  # Year when the exam was made (e.g., 2024)
    study_year = Column(Integer, index=True)  # Academic year (1st, 2nd, 3rd)
    module = Column(String, index=True)  # What was previously called "course"
    unite = Column(String, index=True, nullable=True)  # Unit (for 2nd and 3rd year)
    speciality = Column(String, index=True)
    cours = Column(String, index=True)  # What was previously called "chapter"
    exam_type = Column(String, index=True)  # EMD, EMD1, EMD2, Rattrapage
    number = Column(Integer)
    question_text = Column(Text)
    question_image = Column(String, nullable=True)  # Path to question image
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
    answer_image = Column(String, nullable=True)  # Path to answer image
    is_correct = Column(Boolean, default=False)
    option_label = Column(String(1), index=True)  # 'a', 'b', 'c', 'd', 'e'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    question = relationship("Question", back_populates="answers")

class ActivationKey(Base):
    __tablename__ = "activation_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null if not used
    is_used = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))  # admin/owner who created it
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # expires 1 year after activation
    
    # Relationships
    user = relationship("User", back_populates="activation_keys", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by])

class DeviceSession(Base):
    __tablename__ = "device_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    device_fingerprint = Column(String, index=True)  # unique device identifier
    device_name = Column(String, nullable=True)  # user-friendly device name
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="device_sessions") 