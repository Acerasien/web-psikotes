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