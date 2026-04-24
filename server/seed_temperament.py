# server/seed_temperament.py
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

# 1. Find or create the test container
temp_test = db.query(Test).filter(Test.code == "TEMP").first()

if not temp_test:
    temp_test = Test(
        name="Temperament Test",
        code="TEMP",
        time_limit=300,          # 5 minutes
        settings={"type": "temperament", "randomize_options": False}
    )
    db.add(temp_test)
    db.commit()
    db.refresh(temp_test)
    print("Created Temperament Test container.")
else:
    # Clear old data
    temp_test.time_limit = 300
    old_qs = db.query(Question).filter(Question.test_id == temp_test.id).all()
    old_q_ids = [q.id for q in old_qs]

    if old_q_ids:
        # Delete responses, results and exit logs first (FK constraint)
        from models import Response, Result, ExitLog, Assignment
        db.query(Response).filter(Response.test_id == temp_test.id).delete(synchronize_session=False)
        db.query(Result).filter(Result.test_id == temp_test.id).delete(synchronize_session=False)
        db.query(ExitLog).filter(
            ExitLog.assignment_id.in_(
                db.query(Assignment.id).filter(Assignment.test_id == temp_test.id)
            )
        ).delete(synchronize_session=False)
        db.query(Assignment).filter(Assignment.test_id == temp_test.id).delete(synchronize_session=False)
        db.commit()

        # Delete options
        db.query(Option).filter(Option.question_id.in_(old_q_ids)).delete(synchronize_session=False)
        db.commit()

    db.query(Question).filter(Question.test_id == temp_test.id).delete()
    db.commit()
    print("Updated timer for existing Temperament Test and cleared old data (including responses).")

# 2. Define questions (6 per trait)
# Trait codes: S = Sanguine, C = Choleric, M = Melancholic, P = Phlegmatic
# Format: (text, trait, is_reverse)
questions_data = [
    # Choleric
    ("Saya suka bersaing dengan orang lain.", "C", False),
    ("Saya punya keinginan kuat untuk memimpin atau berkuasa.", "C", False),
    ("Saya mudah marah.", "C", False),
    ("Saya senang jika orang merasa takut pada saya.", "C", False),
    ("Saya suka memerintah orang lain.", "C", False),
    ("Saya berusaha menyenangkan semua orang.", "C", True),
    # Phlegmatic
    ("Saya harus diperlakukan sangat buruk baru bisa marah.", "P", False),
    ("Saya biasanya santai dan tenang.", "P", False),
    ("Saya jarang marah.", "P", False),
    ("Hidup yang baik adalah hidup yang damai dan tenang.", "P", False),
    ("Saya pernah bertengkar besar dengan teman dekat.", "P", True),
    ("Saya merasakan emosi saya dengan sangat dalam.", "P", True),
    # Melancholic
    ("Saya sering merasa sangat putus asa.", "M", False),
    ("Saya merasa cemas hingga sulit dikendalikan.", "M", False),
    ("Saya sering merasa diserang atau disalahkan orang lain.", "M", False),
    ("Saya merasa nyaman dengan diri saya sendiri.", "M", True),
    ("Saya jarang merasa sedih.", "M", True),
    ("Saya tidak terlalu peduli jika ada yang menghina saya.", "M", True),
    # Sanguine
    ("Saya memancarkan kebahagiaan.", "S", False),
    ("Saya jadi pusat perhatian dalam suatu acara.", "S", False),
    ("Saya mudah berteman dengan orang baru.", "S", False),
    ("Saya lebih suka hal-hal yang bervariasi daripada yang berulang-ulang.", "S", False),
    ("Saya membuat orang lain merasa diterima.", "S", False),
    ("Saya suka menari sendiri saat sedang sendirian.", "S", False),
]

# Validate trait balance
trait_counts = {"S": 0, "C": 0, "M": 0, "P": 0}
for _, trait, _ in questions_data:
    trait_counts[trait] += 1

print(f"Temperament trait distribution: {trait_counts}")
if len(set(trait_counts.values())) == 1:
    print(f"(OK) Balanced: Each trait appears {list(trait_counts.values())[0]} times")
else:
    print("(WARNING) Warning: Trait distribution is unbalanced!")

# 3. Likert scale labels (will be the same for all questions)
likert_labels = [
    "Sangat Tidak Menggambarkan Diri Saya",
    "Tidak Menggambarkan Diri Saya",
    "Netral",
    "Menggambarkan Diri Saya",
    "Sangat Menggambarkan Diri Saya"
]

# 4. Insert questions
print("Seeding 24 Temperament questions...")
for idx, (text, trait, is_reverse) in enumerate(questions_data, start=1):
    q = Question(
        test_id=temp_test.id,
        content=text,
        order_index=idx
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Add 5 options (A to E)
    for opt_idx, label_text in enumerate(likert_labels, start=1):
        # Calculate score value
        score_value = opt_idx
        if is_reverse:
            # Reverse scoring: 1->5, 2->4, 3->3, 4->2, 5->1
            score_value = 6 - opt_idx

        opt = Option(
            question_id=q.id,
            label=chr(64 + opt_idx),  # A, B, C, D, E
            content=label_text,
            scoring_logic={
                "trait": trait,
                "value": score_value
            }
        )
        db.add(opt)

db.commit()

# Final validation
total_questions = db.query(Question).filter(Question.test_id == temp_test.id).count()
total_options = db.query(Option).join(Question).filter(Question.test_id == temp_test.id).count()

print(f"\nTemperament test seeded successfully!")
print(f"   - Total questions: {total_questions} (expected: 24)")
print(f"   - Total options: {total_options} (expected: 120)")
print(f"   - Trait balance: Each trait appears exactly 6 times")

db.close()