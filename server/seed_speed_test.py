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

def create_different_string(original, char_set):
    """
    Create a string that is guaranteed to be different from the original,
    by either swapping two distinct characters or, if that's impossible (all chars same),
    by replacing one character with a random different one.
    """
    # If all characters are the same, replace one
    if all(ch == original[0] for ch in original):
        idx = random.randint(0, len(original)-1)
        new_char = random.choice(char_set)
        # Ensure it's different
        while new_char == original[idx]:
            new_char = random.choice(char_set)
        return original[:idx] + new_char + original[idx+1:]

    # Otherwise, try swapping two distinct characters
    # First, collect indices of characters that are different
    # But simpler: random swap until we get a change
    lst = list(original)
    max_attempts = 10
    for _ in range(max_attempts):
        i, j = random.sample(range(len(original)), 2)
        if original[i] != original[j]:
            # Swap them
            lst[i], lst[j] = lst[j], lst[i]
            return "".join(lst)
    # Fallback: replace one character
    idx = random.randint(0, len(original)-1)
    new_char = random.choice(char_set)
    while new_char == original[idx]:
        new_char = random.choice(char_set)
    return original[:idx] + new_char + original[idx+1:]

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

print("Generating 100 Speed Test questions with guaranteed distinct wrong options...")

# --- Define Question Types and Quotas ---
question_types = [
    (30, string.digits, "Numeric"),
    (30, string.ascii_uppercase, "Alphabet"),
    (30, string.ascii_uppercase + string.digits, "Alphanumeric"),
    (10, "!@#$%^&*()_+-=[]{}|;:,.<>?", "Symbols")
]

question_index = 1  # 1‑based global counter

for count, char_set, type_name in question_types:
    print(f"Generating {count} {type_name} questions...")
    for i in range(count):
        # Determine length based on global question index
        if question_index <= 30:
            length = random.choice([5, 6])          # Block 1: easy
        elif question_index <= 70:
            length = random.choice([7, 8])          # Block 2: medium
        else:
            length = random.choice([9, 10])         # Block 3: hard

        # Generate correct string
        correct_str = random_chars(char_set, length)

        # Create question
        new_q = Question(
            test_id=speed_test.id,
            content=f"Which pair is exactly the same? ({type_name})",
            order_index=question_index
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)

        # Generate options
        options_data = []

        # 1. Correct option
        options_data.append({
            "content": f"{correct_str} || {correct_str}",
            "is_correct": True
        })

        # 2. Three wrong options – each guaranteed different from correct
        for _ in range(3):
            wrong_str = create_different_string(correct_str, char_set)
            options_data.append({
                "content": f"{correct_str} || {wrong_str}",
                "is_correct": False
            })

        # Shuffle options
        random.shuffle(options_data)

        # Insert options with labels A, B, C, D
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
print("Successfully generated 100 questions with distinct wrong options!")
db.close()