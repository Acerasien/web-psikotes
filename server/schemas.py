# server/schemas.py
from pydantic import BaseModel
from typing import List, Optional

# What the user sends to login
class UserLogin(BaseModel):
    username: str
    password: str

# What we return after login (The Token)
class Token(BaseModel):
    access_token: str
    token_type: str

# What is inside the token (payload)
class TokenData(BaseModel):
    username: Optional[str] = None

# ClassConfig schemas
class ClassConfigOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    config: dict

    class Config:
        from_attributes = True

# Schema for creating a new user
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "participant"  # Default to participant
    # NEW FIELDS
    full_name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    education: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    business_unit: Optional[str] = None
    class_id: Optional[int] = None

class TestSubmission(BaseModel):
    answers: List[dict]  # Make sure this is List[dict], not dict
    time_taken: int

# IQ Test Phase schemas
class PhaseOut(BaseModel):
    id: int
    order_number: int
    timer_seconds: int
    practice_questions: Optional[list] = None
    status: str  # locked, current, done
    is_unlocked: bool
    answered_count: Optional[int] = None
    total_questions: Optional[int] = None

    class Config:
        from_attributes = True

class PhaseSubmitRequest(BaseModel):
    phase_id: int
    answers: List[dict]  # [{question_id, option_id(s)}]

class IQSubmitAllResponse(BaseModel):
    message: str
    score: int
    max_score: int
    scaled_score: int
    iq: int
    classification: str
    section_scores: dict  # {section_1: {correct, max}, section_2: {correct, max}}
    phase_scores: dict

class PhaseSubmitResponse(BaseModel):
    phase_id: int
    answered_count: int
    correct_count: int

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    education: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    business_unit: Optional[str] = None
    class_id: Optional[int] = None