"""
Fix testuser1 role
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == "testuser1").first()
    if not user:
        print("User not found")
    else:
        print(f"Before: {user.username} role = {user.role}")
        user.role = "participant"
        db.commit()
        print(f"After: {user.username} role = {user.role}")
        print("✅ Fixed!")
finally:
    db.close()
