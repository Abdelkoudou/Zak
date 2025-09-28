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
    year_of_study: Optional[int] = None
    speciality: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    user_type: Optional[UserType] = None
    is_paid: Optional[bool] = None
    year_of_study: Optional[int] = None
    speciality: Optional[str] = None

class User(UserBase):
    id: int
    user_type: UserType
    is_paid: bool
    year_of_study: Optional[int] = None
    speciality: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Answer schemas
class AnswerBase(BaseModel):
    answer_text: str
    answer_image: Optional[str] = None
    is_correct: bool
    option_label: str  # 'a', 'b', 'c', 'd', 'e'

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
    year: int  # Year when exam was made
    study_year: int  # Academic year (1, 2, 3)
    module: str  # What was previously "course"
    unite: Optional[str] = None  # Unit (for 2nd and 3rd year)
    speciality: str
    cours: List[str]  # Multiple courses as array
    exam_type: str  # EMD, EMD1, EMD2, Rattrapage
    number: int
    question_text: str
    question_image: Optional[str] = None

class QuestionCreate(QuestionBase):
    answers: List[AnswerCreate]

class QuestionUpdate(BaseModel):
    year: Optional[int] = None
    study_year: Optional[int] = None
    module: Optional[str] = None
    unite: Optional[str] = None
    speciality: Optional[str] = None
    cours: Optional[List[str]] = None
    exam_type: Optional[str] = None
    number: Optional[int] = None
    question_text: Optional[str] = None
    question_image: Optional[str] = None
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

# Activation Key schemas
class ActivationKeyBase(BaseModel):
    key: str

class ActivationKeyCreate(BaseModel):
    pass  # Key will be generated automatically

class ActivationKeyUse(BaseModel):
    key: str

class ActivationKey(ActivationKeyBase):
    id: int
    user_id: Optional[int] = None
    is_used: bool
    created_by: int
    created_at: datetime
    used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Device Session schemas
class DeviceSessionBase(BaseModel):
    device_fingerprint: str
    device_name: Optional[str] = None

class DeviceSessionCreate(DeviceSessionBase):
    pass

class DeviceSession(DeviceSessionBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    last_seen: datetime

    class Config:
        from_attributes = True

# Password change schema
class PasswordChangeRequest(BaseModel):
    email: str
    current_password: str
    new_password: str