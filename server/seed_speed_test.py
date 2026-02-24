# server/seed_speed_test.py
import random
import string
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option, Response, Result

db: Session = SessionLocal()

# --- Helper Functions ---

def random_chars(char_set, length):
    return ''.join(random.choices(char_set, k=length))

def create_typo(s):
    if len(s) < 2: return s
    s_list = list(s)
    i, j = random.sample(range(len(s_list)), 2)
    s_list[i], s_list[j] = s_list[j], s_list[i]
    return "".join(s_list)

# --- Main Seeding Logic ---

speed_test = db.query(Test).filter(Test.code == "SPEED").first()

if not speed_test:
    speed_test = Test(
        name="Speed Test",
        code="SPEED",
        time_limit=600,
        settings={"type": "speed", "randomize_options": True}
    )
    db.add(speed_test)
    db.commit()
    db.refresh(speed_test)
    print("Created Speed Test container.")
else:
    print("Clearing old data for Speed Test...")
    db.query(Result).filter(Result.test_id == speed_test.id).delete()
    db.query(Response).filter(Response.test_id == speed_test.id).delete()
    old_questions = db.query(Question).filter(Question.test_id == speed_test.id).all()
    if old_questions:
        db.query(Option).filter(Option.question_id.in_([q.id for q in old_questions])).delete(synchronize_session=False)
    db.query(Question).filter(Question.test_id == speed_test.id).delete()
    db.commit()
    print("Old data cleared.")

print("Generating 100 Speed Test questions (Quotas: 30 Num, 30 Alpha, 30 AlphaNum, 10 Sym)...")

# --- Define Question Types and Quotas ---
# Format: (count, character_set, name)
question_types = [
    (30, string.digits, "Numeric"),                     # 0-9
    (30, string.ascii_uppercase, "Alphabet"),           # A-Z
    (30, string.ascii_uppercase + string.digits, "Alphanumeric"), # A-Z + 0-9
    (10, "!@#$%^&*()_+-=[]{}|;:,.<>?", "Symbols")       # Special chars
]

question_index = 1

# --- Generation Loop ---

for count, char_set, type_name in question_types:
    print(f"Generating {count} {type_name} questions...")
    
    for i in range(count):
        # NEW LOGIC: Strict linear progression
        # Q1-10: 2 digits, Q11-20: 3 digits, etc.
        # Formula: floor((index - 1) / 10) + 2
        length = ((question_index - 1) // 10) + 2
        
        # Cap the length at 10 or 11 so it doesn't get ridiculous at the end
        if length > 11: length = 11

        # Generate correct string based on current type
        correct_str = random_chars(char_set, length)
        
        # Create Question
        new_q = Question(
            test_id=speed_test.id,
            content=f"Which pair is exactly the same? ({type_name})", # Added type hint for you to verify
            order_index=question_index
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)
        
        # Generate Options
        options_data = []
        
        # 1. Correct Option
        options_data.append({
            "content": f"{correct_str} || {correct_str}",
            "is_correct": True
        })
        
        # 2. Distractors (3 wrong answers)
        for _ in range(3):
            # Create a typo version for the second part of the pair
            typo_str = create_typo(correct_str)
            options_data.append({
                "content": f"{correct_str} || {typo_str}",
                "is_correct": False
            })
            
        # Shuffle options
        random.shuffle(options_data)
        
        # Insert Options
        labels = ["A", "B", "C", "D"]
        for idx, opt in enumerate(options_data):
            new_opt = Option(
                question_id=new_q.id,
                label=labels[idx],
                content=opt["content"],
                scoring_logic={"correct": opt["is_correct"]}
            )
            db.add(new_opt)
        
        question_index += 1

db.commit()
print("Successfully generated 100 questions with correct types!")
db.close()