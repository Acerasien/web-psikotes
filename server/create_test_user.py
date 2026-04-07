"""
Quick script to create a test user
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from auth import hash_password

def create_test_user():
    db = SessionLocal()
    try:
        # Check if user exists
        existing = db.query(User).filter(User.username == "testuser1").first()
        if existing:
            print(f"User 'testuser1' already exists with id={existing.id}")
            return
        
        # Create new user
        user = User(
            username="testuser1",
            password_hash=hash_password("test123"),
            role="participant",  # Fixed: should be participant not user
            full_name="Test User One",
            department="Testing",
            position="Test Subject"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Created user 'testuser1' with id={user.id}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
