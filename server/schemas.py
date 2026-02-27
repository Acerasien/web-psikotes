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

class TestSubmission(BaseModel):
    answers: List[dict]  # Make sure this is List[dict], not dict
    time_taken: int
    
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