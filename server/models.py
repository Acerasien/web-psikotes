# server/models.py
from sqlalchemy import Column, Integer, String, Enum
from database import Base
import enum

# Define the Role Enum
class UserRole(enum.Enum):
    admin = "admin"
    participant = "participant"

# Define the User Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String) # We will handle hashing later
    role = Column(String, default=UserRole.participant.value) 