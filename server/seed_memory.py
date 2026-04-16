# server/seed_memory.py
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

# Original table data (from your picture)
categories = {
    "KOTAK ROKOK": ["ESKORT 703", "KANSAS 618", "KRESTA 610", "MENARA 721", "POMPA 624"],
    "PENERBANGAN": ["BARAT MG", "PUSAT AJ", "SELATAN NX", "TIMUR VK", "UTARA LP"],
    "JURU BAYAR": ["BUKU 9H", "KAIN 6D", "LISTRIK 7C", "SABUN 2B", "TOPI 3F"],
    "NOMOR TILPUN": ["ADI 23", "GATOT 13", "YUNI 17", "SURYA 28", "TAN 19"],
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
        else:
            # fallback (should not happen)
            item_to_code[entry] = ""

# Add alias for "YANI" (should be YUNI)
item_to_code["YANI"] = "17"

# The 50 questions as provided (with fixes for typos)
# Format: (item, [option1, option2, option3])
questions_raw = [
    ("SABUN", ["610", "2B", "Y36"]),
    ("TIMUR", ["VK", "23", "T54"]),
    ("GATOT", ["LP", "2B", "13"]),
    ("KAIN", ["703", "9H", "6D"]),
    ("KRESTA", ["610", "23", "R42"]),
    ("TOPI", ["721", "3F", "Q40"]),
    ("PUSAT", ["610", "AJ", "28"]),
    ("MENARA", ["721", "19", "R42"]),
    ("TAN", ["YK", "23", "19"]),          # YK is a distractor, correct 19
    ("CAT", ["624", "7C", "Y36"]),
    ("LISTRIK", ["703", "7C", "28"]),
    ("KANSAS", ["618", "3F", "17"]),
    ("BARAT", ["MG", "7C", "T54"]),
    ("YANI", ["VK", "17", "E57"]),        # YANI = YUNI, correct 17
    ("BUKU", ["624", "9H", "Y36"]),
    ("KAWAT", ["618", "6D", "Q40"]),
    ("POMPA", ["624", "AJ", "19"]),
    ("SELATAN", ["NX", "13", "E57"]),
    ("PAKU", ["MG", "6D", "R42"]),        # Fixed: "42" -> "R42"
    ("UTARA", ["LP", "3F", "17"]),
    ("KUNCI", ["721", "13", "T54"]),
    ("ADI", ["618", "AJ", "23"]),
    ("PIPA", ["NX", "13", "E57"]),
    ("ESKORT", ["703", "LD", "9H"]),      # LD is a distractor, correct 703
    ("SURYA", ["MG", "28", "Q40"]),
    ("KAWAT", ["VK", "2B", "Q40"]),
    ("GATOT", ["3F", "13", "Y36"]),
    ("TOPI", ["3F", "28", "Q40"]),        # Fixed: replaced 618 with 3F
    ("TOPI", ["618", "VK", "6D"]),        # This one originally had no correct; we'll keep but correct? Actually we need to fix: let's set correct to 3F and replace first with 3F? But we already have another TOPI with correct. To avoid duplicate, we'll treat this as a separate question with correct 3F. So we'll replace first option with 3F.
    ("KANSAS", ["618", "NX", "9H"]),
    ("ESKORT", ["703", "7C", "E57"]),
    ("BARAT", ["610", "MG", "9H"]),
    ("SABUN", ["2B", "23", "Y36"]),
    ("YANI", ["NX", "3F", "17"]),
    ("SELATAN", ["610", "NX", "E57"]),
    ("KUNCI", ["721", "7C", "T54"]),
    ("ADI", ["MG", "23", "Q40"]),
    ("KRESTA", ["610", "2B", "T54"]),
    ("POMPA", ["624", "MG", "6D"]),
    ("TIMUR", ["703", "VK", "T54"]),
    ("LISTRIK", ["LP", "19", "7C"]),
    ("PUSAT", ["AJ", "9H", "19"]),
    ("PIPA", ["703", "17", "E57"]),
    ("MENARA", ["721", "LP", "23"]),
    ("SURYA", ["AJ", "13", "28"]),
    ("KAIN", ["618", "6D", "R42"]),
    ("CAT", ["721", "17", "Y36"]),
    ("TAN", ["AJ", "19", "R42"]),         # Fixed: replaced "15" with "19"
    ("UTARA", ["624", "LP", "13"]),
    ("PAKU", ["624", "28", "R42"]),
]

# Ensure we have exactly 50 questions
assert len(questions_raw) == 50

# For each question, determine correct index based on item_to_code
questions = []
for item, options in questions_raw:
    correct_code = item_to_code.get(item)
    if correct_code is None:
        print(f"Warning: Item '{item}' not found in mapping. Using first option as correct.")
        correct_index = 0
    else:
        # Find which option matches the correct code
        try:
            correct_index = options.index(correct_code)
        except ValueError:
            # Correct code not in options – replace the first option with correct code
            print(f"Fixing question for {item}: replacing '{options[0]}' with '{correct_code}'")
            options[0] = correct_code
            correct_index = 0
    questions.append((item, options, correct_index))

# 1. Find or create the test container
mem_test = db.query(Test).filter(Test.code == "MEM").first()

if not mem_test:
    mem_test = Test(
        name="Memory Test",
        code="MEM",
        time_limit=180,
        settings={
            "type": "memory",
            "encoding_time": 180,
            "recall_time": 600,
            "total_questions": 50,
            "table_data": categories
        }
    )
    db.add(mem_test)
    db.commit()
    db.refresh(mem_test)
    print("Created Memory Test container with table data.")
else:
    # Update settings and clear old questions
    mem_test.time_limit = 180
    mem_test.settings = {
        "type": "memory",
        "encoding_time": 180,
        "recall_time": 600,
        "total_questions": 50,
        "table_data": categories
    }
    # Delete old questions and options with FK handling
    old_qs = db.query(Question).filter(Question.test_id == mem_test.id).all()
    old_q_ids = [q.id for q in old_qs]

    if old_q_ids:
        from models import Response, Result, ExitLog, Assignment
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
    print("Updated existing Memory Test and cleared old data (including responses).")

# 2. Insert questions (order preserved; frontend can shuffle)
print("Seeding 50 memory questions from provided list...")
for idx, (item, options, correct_idx) in enumerate(questions, start=1):
    # Create question (content includes the item name)
    q = Question(
        test_id=mem_test.id,
        content=f"Apa kode dari {item}?",
        order_index=idx,
        meta_data={"item": item}
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Insert options (shuffle order to avoid pattern)
    opt_list = list(enumerate(options))
    random.shuffle(opt_list)
    for j, (orig_idx, text) in enumerate(opt_list):
        is_correct = (orig_idx == correct_idx)
        opt = Option(
            question_id=q.id,
            label=chr(65 + j),
            content=text,
            scoring_logic={"correct": is_correct}
        )
        db.add(opt)

db.commit()
print("Memory test seeded successfully with 50 fixed questions!")
db.close()