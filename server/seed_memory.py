# server/seed_memory.py
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option
import random

db: Session = SessionLocal()

# Define the data from the picture (5 categories, each with 5 items)
categories = {
    "KOTAK ROKOK": ["ESKORT 703", "KANSAS 618", "KRESTA 610", "MENARA 721", "POMPA 624"],
    "PENERBANGAN": ["BARAT MG", "PUSAT AJ", "SELATAN NX", "TIMUR VK", "UTARA LP"],
    "JURU BAYAR": ["BUKU 9H", "KAIN 6D", "LISTRIK 7C", "SABUN 2B", "TOPI 3F"],
    "NOMOR TILPUN": ["ADI 23", "GATOT 13", "YUNI 17", "SURYA 28", "TAN 19"],
    "BUKU GUDANG": ["KAWAT Q40", "KUNCI T54", "PAKU R42", "PIPA E57", "CAT Y36"]
}

# Build a list of all items with their details
items = []
for cat, entries in categories.items():
    for entry in entries:
        # Split into name and code (last token is the code)
        parts = entry.rsplit(' ', 1)
        if len(parts) == 2:
            name, code = parts
        else:
            name, code = entry, ""  # fallback (should not happen)
        items.append({
            "name": name,
            "code": code,
            "category": cat
        })

total_items = len(items)  # 25

# 1. Find or create the test container
mem_test = db.query(Test).filter(Test.code == "MEM").first()

if not mem_test:
    mem_test = Test(
        name="Memory Test",
        code="MEM",
        time_limit=180,  # encoding phase in seconds (will be used as default, but we store in settings)
        settings={
            "type": "memory",
            "encoding_time": 180,
            "recall_time": 600,
            "total_questions": total_items * 2,
            "table_data": categories  # store the exact table structure
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
        "total_questions": total_items * 2,
        "table_data": categories
    }
    # Delete old questions and options
    old_qs = db.query(Question).filter(Question.test_id == mem_test.id).all()
    for q in old_qs:
        db.query(Option).filter(Option.question_id == q.id).delete()
    db.query(Question).filter(Question.test_id == mem_test.id).delete()
    db.commit()
    print("Updated existing Memory Test and cleared old data.")

# 2. Generate 50 questions (2 per item)
print("Generating 50 memory questions...")
question_index = 1
for item in items:
    name = item["name"]
    code = item["code"]
    cat = item["category"]

    # --- Question 1: What is the code of [name]? ---
    q1 = Question(
        test_id=mem_test.id,
        content=f"Apa kode dari {name}?",
        order_index=question_index,
        meta_data={"type": "code", "item": name, "correct_code": code}
    )
    db.add(q1)
    db.commit()
    db.refresh(q1)

    # Generate options: correct code + 3 distractors (other codes)
    all_codes = [it["code"] for it in items if it["code"] != code]
    distractors = random.sample(all_codes, 3) if len(all_codes) >= 3 else all_codes + ["XXX"] * (3 - len(all_codes))
    options = [code] + distractors[:3]
    random.shuffle(options)
    for idx, opt_text in enumerate(options):
        opt = Option(
            question_id=q1.id,
            label=chr(65 + idx),
            content=opt_text,
            scoring_logic={"correct": opt_text == code}
        )
        db.add(opt)
    question_index += 1

    # --- Question 2: Which category does [name] belong to? ---
    q2 = Question(
        test_id=mem_test.id,
        content=f"Di kategori mana {name} berada?",
        order_index=question_index,
        meta_data={"type": "category", "item": name, "correct_category": cat}
    )
    db.add(q2)
    db.commit()
    db.refresh(q2)

    # Generate options: correct category + 3 other categories
    all_cats = list(categories.keys())
    other_cats = [c for c in all_cats if c != cat]
    distractors = random.sample(other_cats, 3) if len(other_cats) >= 3 else other_cats + ["Lainnya"] * (3 - len(other_cats))
    options = [cat] + distractors[:3]
    random.shuffle(options)
    for idx, opt_text in enumerate(options):
        opt = Option(
            question_id=q2.id,
            label=chr(65 + idx),
            content=opt_text,
            scoring_logic={"correct": opt_text == cat}
        )
        db.add(opt)
    question_index += 1

db.commit()
print(f"Successfully seeded {total_items * 2} memory questions!")
db.close()