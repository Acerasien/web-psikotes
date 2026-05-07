# server/fix_memory_options.py
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

def generate_distractors(code):
    """Generate visually similar 3-character distractors (Fixed Logic)."""
    replacements = {
        '0': ['O', '8', '6'],
        'O': ['0', 'Q', 'D'],
        '1': ['I', 'L', '7'],
        'I': ['1', 'L', 'T'],
        '2': ['Z', '7', '5'],
        '5': ['S', '6', '2'],
        'S': ['5', '8', 'B'],
        '8': ['B', '0', '3'],
        'B': ['8', 'P', 'R'],
        'G': ['6', 'C', 'Q'],
        '6': ['G', '5', '0'],
        '7': ['1', 'T', 'V'],
        'V': ['U', 'Y', '7'],
        'Y': ['V', 'X', 'K'],
    }
    
    distractors = set()
    code_list = list(code)
    
    for i in range(len(code_list)):
        char = code_list[i]
        if char in replacements:
            for rep in replacements[char]:
                new_code = list(code_list)
                new_code[i] = rep
                candidate = "".join(new_code)
                if candidate != code:
                    distractors.add(candidate)
    
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    while len(distractors) < 10:
        idx = random.randint(0, len(code_list)-1)
        new_char = random.choice(chars)
        new_code = list(code_list)
        new_code[idx] = new_char
        candidate = "".join(new_code)
        if candidate != code:
            distractors.add(candidate)
        
    res = list(distractors)
    random.shuffle(res)
    return res[:4]

def fix_memory_duplicates():
    db: Session = SessionLocal()
    try:
        # 1. Find the Memory Test
        mem_test = db.query(Test).filter(Test.code == "MEM").first()
        if not mem_test:
            print("Memory Test not found.")
            return

        # 2. Get all questions for this test
        questions = db.query(Question).filter(Question.test_id == mem_test.id).all()
        print(f"Found {len(questions)} questions in Memory Test. Fixing options...")

        updated_count = 0
        for q in questions:
            # Find the correct answer content to generate distractors against it
            correct_opt = next((opt for opt in q.options if opt.scoring_logic.get("correct")), None)
            if not correct_opt:
                continue
            
            # The code is usually just the first 3-5 chars of the content or the whole content
            # In our seed_memory, it's the whole string (e.g., '70B')
            correct_code = correct_opt.content
            
            # Generate 4 new distractors
            new_distractors = generate_distractors(correct_code)
            
            # Find existing distractors (incorrect options)
            incorrect_opts = [opt for opt in q.options if not opt.scoring_logic.get("correct")]
            
            # Update each distractor's content
            for i, opt in enumerate(incorrect_opts):
                if i < len(new_distractors):
                    opt.content = new_distractors[i]
                    updated_count += 1
        
        db.commit()
        print(f"Successfully updated {updated_count} distractor options without deleting any results.")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_memory_duplicates()
