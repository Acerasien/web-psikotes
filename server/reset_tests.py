"""
Re-assign tests to testuser1 for edge case testing
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Test, Assignment, Result, Response
from datetime import datetime

def reassign_tests():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "testuser1").first()
        if not user:
            print("❌ User not found")
            return
        
        tests = db.query(Test).all()
        
        for test in tests:
            # Find existing assignment
            assignment = db.query(Assignment).filter(
                Assignment.user_id == user.id,
                Assignment.test_id == test.id
            ).first()
            
            if assignment:
                # Delete existing results and responses
                db.query(Response).filter(Response.assignment_id == assignment.id).delete()
                db.query(Result).filter(Result.assignment_id == assignment.id).delete()
                
                # Reset assignment
                assignment.status = "pending"
                assignment.pretest_completed = False
                assignment.assigned_at = datetime.now()
                print(f"🔄 Reset '{test.name}'")
            else:
                # Create new assignment
                assignment = Assignment(
                    user_id=user.id,
                    test_id=test.id,
                    assigned_at=datetime.now(),
                    status="pending"
                )
                db.add(assignment)
                print(f"✅ Assigned '{test.name}'")
        
        db.commit()
        print(f"\n🎉 All tests reset for {user.full_name}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reassign_tests()
