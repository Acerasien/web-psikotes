# server/seed_memory.py
import random
import os
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option, Response, Result, ExitLog, Assignment

db: Session = SessionLocal()

def generate_distractors(code):
    """Generate visually similar 3-character distractors."""
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
    
    # Try to generate variants by replacing characters
    for i in range(len(code_list)):
        char = code_list[i]
        if char in replacements:
            for rep in replacements[char]:
                new_code = list(code_list)
                new_code[i] = rep
                distractors.add("".join(new_code))
    
    # If not enough, mutate randomly
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    while len(distractors) < 10:
        idx = random.randint(0, len(code_list)-1)
        new_char = random.choice(chars)
        new_code = list(code_list)
        new_code[idx] = new_char
        distractors.add("".join(new_code))
        
    res = list(distractors)
    random.shuffle(res)
    return res[:4]

# Expert Level Table Data
categories = {
    "KOTAK ROKOK": ["ESKORT 70B", "KANSAS 618", "KRESTA 6IO", "MENARA 72I", "POMPA 62S"],
    "PENERBANGAN": ["BARAT M6G", "PUSAT AJ1", "SELATAN NX5", "TIMUR V1K", "UTARA LP0"],
    "JURU BAYAR": ["BUKU 9H2", "KAIN 6D4", "LISTRIK 7C1", "SABUN 2B5", "TOPI 3F8"],
    "NOMOR TILPUN": ["ADI 23S", "GATOT 13T", "YUNI 17P", "SURYA 28L", "TAN 19R"],
    "BUKU GUDANG": ["KAWAT Q40", "KUNCI T54", "PAKU R42", "PIPA E57", "CAT Y36"]
}

# Build item -> correct code mapping
item_to_code = {}
for cat, entries in categories.items():
    for entry in entries:
        parts = entry.rsplit(' ', 1)
        if len(parts) == 2:
            name, code = parts
            item_to_code[name] = code

# The 50 questions
items = list(item_to_code.keys())
questions_data = []

# Generate 50 questions by cycling through items and generating unique distractors
for i in range(50):
    item = items[i % len(items)]
    correct_code = item_to_code[item]
    distractors = generate_distractors(correct_code)
    options = [correct_code] + distractors
    random.shuffle(options)
    correct_idx = options.index(correct_code)
    questions_data.append((item, options, correct_idx))

# 1. Find or update the test container
mem_test = db.query(Test).filter(Test.code == "MEM").first()

settings = {
    "type": "memory",
    "encoding_time": 120,      # Reduced to 2 minutes
    "recall_time": 480,        # Reduced to 8 minutes
    "total_questions": 50,
    "table_data": categories
}

if not mem_test:
    mem_test = Test(
        name="Memory Test",
        code="MEM",
        time_limit=120,
        settings=settings
    )
    db.add(mem_test)
    db.commit()
    db.refresh(mem_test)
    print("Created Expert Memory Test container.")
else:
    mem_test.time_limit = 120
    mem_test.settings = settings
    
    # Clean up old data
    old_qs = db.query(Question).filter(Question.test_id == mem_test.id).all()
    old_q_ids = [q.id for q in old_qs]

    if old_q_ids:
        db.query(Response).filter(Response.test_id == mem_test.id).delete(synchronize_session=False)
        db.query(Result).filter(Result.test_id == mem_test.id).delete(synchronize_session=False)
        db.query(ExitLog).filter(
            ExitLog.assignment_id.in_(
                db.query(Assignment.id).filter(Assignment.test_id == mem_test.id)
            )
        ).delete(synchronize_session=False)
        db.query(Assignment).filter(Assignment.test_id == mem_test.id).delete(synchronize_session=False)
        db.commit()
        db.query(Option).filter(Option.question_id.in_(old_q_ids)).delete(synchronize_session=False)
        db.commit()

    db.query(Question).filter(Question.test_id == mem_test.id).delete()
    db.commit()
    print("Updated Memory Test to Expert Level settings.")

# 2. Insert questions
print("Seeding 50 expert memory questions...")
for idx, (item, options, correct_idx) in enumerate(questions_data, start=1):
    q = Question(
        test_id=mem_test.id,
        content=f"Apa kode dari {item}?",
        order_index=idx,
        meta_data={"item": item}
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    for j, text in enumerate(options):
        is_correct = (j == correct_idx)
        opt = Option(
            question_id=q.id,
            label=chr(65 + j),
            content=text,
            scoring_logic={"correct": is_correct}
        )
        db.add(opt)

db.commit()
print("Expert Memory test seeded successfully!")
db.close()