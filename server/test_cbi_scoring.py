from database import SessionLocal
from scoring.cbi import score_cbi_test
from models import Test, Question

def test_scoring():
    db = SessionLocal()
    test = db.query(Test).filter(Test.code == "CBI").first()
    questions = db.query(Question).filter(Question.test_id == test.id).all()
    
    answers = []
    for q in questions:
        # Pick the first option
        answers.append({"question_id": q.id, "option_id": q.options[0].id})
        
    result = score_cbi_test(answers, questions)
    import json
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_scoring()
