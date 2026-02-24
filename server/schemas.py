# server/schemas.py
from pydantic import BaseModel
from typing import Optional

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
    age: Optional[int] = None
    education: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None