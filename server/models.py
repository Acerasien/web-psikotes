# server/models.py
from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Boolean, DateTime
from database import Base
import enum
from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

# Define the Role Enum
class UserRole(enum.Enum):
    admin = "admin"
    participant = "participant"

# Define the User Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="participant")
    
    # NEW FIELDS FOR REPORT
    full_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    education = Column(String, nullable=True)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)

# 1. The Test Model (e.g., IQ Test, DISC)
class Test(Base):
    __tablename__ = "tests"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # e.g., "IQ Test"
    code = Column(String, unique=True, index=True) # e.g., "IQ"
    time_limit = Column(Integer)  # Time in seconds
    settings = Column(JSON, nullable=True) # Store config like 'passing_score'
    
    # Relationship: One Test has many Questions
    questions = relationship("Question", back_populates="test")

# 2. The Question Model
class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"))
    content = Column(String) 
    order_index = Column(Integer)
    
    # CHANGE 'metadata' to 'meta_data' to avoid conflict
    meta_data = Column(JSON, nullable=True) 
    
    # Relationships
    test = relationship("Test", back_populates="questions")
    options = relationship("Option", back_populates="question")

# 3. The Option Model (The answers)
class Option(Base):
    __tablename__ = "options"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    label = Column(String) # A, B, C, D
    content = Column(String) # The answer text or image filename
    scoring_logic = Column(JSON, nullable=True) # e.g., {"correct": true} or {"trait": "D"}
    
    # Relationship
    question = relationship("Question", back_populates="options")

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    test_id = Column(Integer, ForeignKey("tests.id"))
    status = Column(String, default="pending") # pending, in_progress, completed, locked
    pretest_completed = Column(Boolean, default=False) # The Tutorial flag
    assigned_at = Column(DateTime, default=datetime.utcnow) # Needs import: from datetime import datetime
    
    # Relationships
    user = relationship("User")
    test = relationship("Test")

class Response(Base):
    __tablename__ = "responses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    test_id = Column(Integer, ForeignKey("tests.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_option_id = Column(Integer, ForeignKey("options.id"))
    
    # NEW FIELD: To distinguish between 'most', 'least', or 'single' (for speed test)
    selection_type = Column(String, default="single") 
    
    # Relationships
    user = relationship("User")
    test = relationship("Test")
    question = relationship("Question")
    option = relationship("Option")

class Result(Base):
    __tablename__ = "results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    test_id = Column(Integer, ForeignKey("tests.id"))
    score = Column(Integer, default=0)
    time_taken = Column(Integer) # in seconds
    completed_at = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON, nullable=True)  # <-- ADD THIS LINE
    
    # Relationships
    user = relationship("User")
    test = relationship("Test")