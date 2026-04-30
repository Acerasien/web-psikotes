# server/fix_iq_scores.py
import sys
import os

# Add parent directory to sys.path to import models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Result, Test, Assignment
import json

def fix_iq_scores():
    db = SessionLocal()
    try:
        # Find the IQ test
        iq_test = db.query(Test).filter(Test.code == "IQ").first()
        if not iq_test:
            print("IQ test not found.")
            return

        # Find all results for this test
        results = db.query(Result).filter(Result.test_id == iq_test.id).all()
        print(f"Found {len(results)} IQ results to check.")

        fixed_count = 0
        for r in results:
            details = r.details or {}
            raw_score = details.get("raw_score")
            
            if raw_score is not None:
                # Update score if it's currently the scaled version (approx raw/2)
                # or just force it to raw_score for consistency
                if r.score != raw_score:
                    print(f"Fixing Result ID {r.id}: Score {r.score} -> {raw_score}")
                    r.score = raw_score
                    
                    # Ensure scaled_score is in details for record keeping
                    if "scaled_score" not in details:
                        details["scaled_score"] = round(raw_score / 2)
                        r.details = details # Trigger SQLAlchemy update
                    
                    fixed_count += 1
            else:
                print(f"Result ID {r.id} has no raw_score in details. Skipping.")

        if fixed_count > 0:
            db.commit()
            print(f"Successfully fixed {fixed_count} results.")
        else:
            print("No results needed fixing.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_iq_scores()
