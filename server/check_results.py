"""
Check test results for testuser1
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Result, Assignment, Test, User

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == "testuser1").first()
    if not user:
        print("User not found")
    else:
        print(f"\n=== Results for {user.full_name} ===\n")
        results = db.query(Result).filter(Result.user_id == user.id).all()
        for r in results:
            test = db.query(Test).filter(Test.id == r.test_id).first()
            assignment = db.query(Assignment).filter(Assignment.id == r.assignment_id).first()
            print(f"Test: {test.name if test else 'Unknown'}")
            print(f"  Score: {r.score}")
            print(f"  Assignment Status: {assignment.status if assignment else 'N/A'}")
            print(f"  Time Taken: {r.time_taken} seconds")
            print()
        print(f"Total results: {len(results)}")
finally:
    db.close()
