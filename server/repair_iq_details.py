# server/repair_iq_details.py
import sys
import os

# Add parent directory to sys.path to import models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Result, Test, Assignment, Response, Question
from scoring.iq import score_iq
from sqlalchemy.orm import joinedload
from datetime import datetime

def repair_iq_details():
    db = SessionLocal()
    try:
        # Find the IQ test
        iq_test = db.query(Test).filter(Test.code == "IQ").first()
        if not iq_test:
            print("IQ test not found.")
            return

        # Fetch questions once
        questions = db.query(Question).options(joinedload(Question.options)).filter(Question.test_id == iq_test.id).all()
        print(f"Loaded {len(questions)} questions for scoring.")

        # Find all results for this test
        results = db.query(Result).filter(Result.test_id == iq_test.id).all()
        print(f"Found {len(results)} IQ results to check.")

        repaired_count = 0
        for r in results:
            print(f"\nChecking Result ID {r.id} (User ID {r.user_id}):")
            
            # Check if details is empty or missing IQ specific fields
            details = r.details or {}
            if "iq" in details and "raw_score" in details:
                print(f"  Result already has IQ details. Skipping.")
                continue

            # Fetch responses for this assignment
            responses = db.query(Response).filter(Response.assignment_id == r.assignment_id).all()
            if not responses:
                print(f"  WARNING: No responses found for assignment {r.assignment_id}. Cannot re-score.")
                continue

            # Convert responses to scoring format
            q_map = {}
            for resp in responses:
                if resp.question_id not in q_map:
                    q_map[resp.question_id] = {"question_id": resp.question_id, "option_id": resp.selected_option_id, "type": resp.selection_type}
                if resp.selection_type == "multi":
                    curr = str(q_map[resp.question_id]["option_id"])
                    if resp.selected_option_id and str(resp.selected_option_id) not in curr:
                        q_map[resp.question_id]["option_id"] = f"{curr},{resp.selected_option_id}" if curr != "None" else str(resp.selected_option_id)
            
            answers_to_score = list(q_map.values())
            print(f"  Found {len(answers_to_score)} answers. Re-scoring...")

            # Re-score
            new_details = score_iq(answers_to_score, questions)
            
            # Preserve session info if exists
            if "session" in details:
                new_details["session"] = details["session"]
            else:
                new_details["session"] = {
                    "device": "Data Repair Script",
                    "started_at": r.completed_at.isoformat() if r.completed_at else None,
                    "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                    "is_auto": True
                }
            
            # Update result
            r.details = new_details
            r.score = new_details["raw_score"] # Ensure score column matches raw_score
            
            print(f"  Successfully repaired. New IQ: {new_details['iq']}, Score: {new_details['raw_score']}")
            repaired_count += 1

        if repaired_count > 0:
            db.commit()
            print(f"\nSuccessfully repaired {repaired_count} results.")
        else:
            print("\nNo results needed repair.")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    repair_iq_details()
