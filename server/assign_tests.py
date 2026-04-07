"""
Assign all test types to testuser1
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Test, Assignment
from datetime import datetime, timedelta

def assign_tests():
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).filter(User.username == "testuser1").first()
        if not user:
            print("❌ User 'testuser1' not found")
            return
        
        # Get all tests
        tests = db.query(Test).all()
        print(f"Found {len(tests)} tests available")
        
        # Assign each test
        assigned_count = 0
        for test in tests:
            # Check if already assigned
            existing = db.query(Assignment).filter(
                Assignment.user_id == user.id,
                Assignment.test_id == test.id
            ).first()
            
            if existing:
                print(f"⚠️  {test.name} already assigned to {user.full_name}")
                continue
            
            # Create assignment
            assignment = Assignment(
                user_id=user.id,
                test_id=test.id,
                assigned_at=datetime.now(),
                status="pending"
            )
            db.add(assignment)
            assigned_count += 1
            print(f"✅ Assigned '{test.name}' to {user.full_name}")
        
        db.commit()
        print(f"\n🎉 Assigned {assigned_count} new tests to {user.full_name}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    assign_tests()
