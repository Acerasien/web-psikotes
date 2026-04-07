"""
Check testuser1 status
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Assignment

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == "testuser1").first()
    if not user:
        print("User not found")
    else:
        print(f"\n=== User: {user.full_name} ===")
        print(f"Username: {user.username}")
        print(f"Role: {user.role}")
        print(f"ID: {user.id}")
        
        assignments = db.query(Assignment).filter(Assignment.user_id == user.id).all()
        print(f"\nAssignments: {len(assignments)}")
        for a in assignments:
            print(f"  - Test ID {a.test_id}: {a.status}")
finally:
    db.close()
