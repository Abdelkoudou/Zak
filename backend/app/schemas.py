from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from .models import UserType

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    user_type: Optional[UserType] = None
    is_paid: Optional[bool] = None

class User(UserBase):
    id: int
    user_type: UserType
    is_paid: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Answer schemas
class AnswerBase(BaseModel):
    answer_text: str
    is_correct: bool

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    id: int
    question_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Question schemas
class QuestionBase(BaseModel):
    year: int
    course: str
    number: int
    question_text: str

class QuestionCreate(QuestionBase):
    answers: List[AnswerCreate]

class QuestionUpdate(BaseModel):
    year: Optional[int] = None
    course: Optional[str] = None
    number: Optional[int] = None
    question_text: Optional[str] = None
    answers: Optional[List[AnswerCreate]] = None

class Question(QuestionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    answers: List[Answer] = []

    class Config:
        from_attributes = True

class QuestionResponse(Question):
    correct_answers: Optional[List[Answer]] = None

    class Config:
        from_attributes = True