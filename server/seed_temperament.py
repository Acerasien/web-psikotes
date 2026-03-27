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
    for q in old_qs:
        db.query(Option).filter(Option.question_id == q.id).delete()
    db.query(Question).filter(Question.test_id == temp_test.id).delete()
    db.commit()
    print("Updated timer for existing Temperament Test.")
    print("Cleared old Temperament data.")

# 2. Define questions (7 per trait)
# Trait codes: S = Sanguine, C = Choleric, M = Melancholic, P = Phlegmatic
questions_data = [
    # Sanguine
    ("Saya senang menjadi pusat perhatian", "S"),
    ("Saya mudah bergaul dengan orang baru", "S"),
    ("Saya optimis dalam menghadapi masalah", "S"),
    ("Saya suka bercerita dan berbagi pengalaman", "S"),
    ("Saya cepat akrab dengan orang lain", "S"),
    ("Saya memiliki banyak teman", "S"),
    ("Saya menikmati pesta dan keramaian", "S"),
    # Choleric
    ("Saya suka memimpin dan mengambil keputusan", "C"),
    ("Saya tegas dalam menyampaikan pendapat", "C"),
    ("Saya memiliki dorongan kuat untuk mencapai target", "C"),
    ("Saya tidak mudah menyerah", "C"),
    ("Saya suka tantangan", "C"),
    ("Saya cepat bertindak ketika ada masalah", "C"),
    ("Saya percaya diri dengan kemampuan saya", "C"),
    # Melancholic
    ("Saya cenderung perfeksionis", "M"),
    ("Saya suka menganalisis sesuatu secara mendalam", "M"),
    ("Saya peka terhadap perasaan orang lain", "M"),
    ("Saya suka bekerja sendiri", "M"),
    ("Saya mudah merasa sedih", "M"),
    ("Saya teratur dan rapi", "M"),
    ("Saya suka merencanakan sesuatu dengan detail", "M"),
    # Phlegmatic
    ("Saya tenang dalam situasi sulit", "P"),
    ("Saya menghindari konflik", "P"),
    ("Saya sabar menghadapi orang lain", "P"),
    ("Saya mudah beradaptasi", "P"),
    ("Saya konsisten dalam bekerja", "P"),
    ("Saya pendengar yang baik", "P"),
    ("Saya tidak suka terburu-buru", "P"),
]

# Validate trait balance
trait_counts = {"S": 0, "C": 0, "M": 0, "P": 0}
for _, trait in questions_data:
    trait_counts[trait] += 1

print(f"Temperament trait distribution: {trait_counts}")
if len(set(trait_counts.values())) == 1:
    print(f"✓ Balanced: Each trait appears {list(trait_counts.values())[0]} times")
else:
    print("⚠ Warning: Trait distribution is unbalanced!")

# 3. Likert scale labels (will be the same for all questions)
likert_labels = [
    "Sangat Tidak Setuju",
    "Tidak Setuju",
    "Agak Tidak Setuju",
    "Agak Setuju",
    "Setuju",
    "Sangat Setuju"
]

# 4. Insert questions
print("Seeding 28 Temperament questions...")
for idx, (text, trait) in enumerate(questions_data, start=1):
    q = Question(
        test_id=temp_test.id,
        content=text,
        order_index=idx
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Add 6 options (A to F)
    for opt_idx, label_text in enumerate(likert_labels, start=1):
        # scoring_logic: store trait and value (1-6)
        # value is used for scoring (1 = strongly disagree, 6 = strongly agree)
        opt = Option(
            question_id=q.id,
            label=chr(64 + opt_idx),  # A, B, C, D, E, F
            content=label_text,
            scoring_logic={
                "trait": trait,
                "value": opt_idx
            }
        )
        db.add(opt)

db.commit()

# Final validation
total_questions = db.query(Question).filter(Question.test_id == temp_test.id).count()
total_options = db.query(Option).join(Question).filter(Question.test_id == temp_test.id).count()

print(f"\n✅ Temperament test seeded successfully!")
print(f"   - Total questions: {total_questions} (expected: 28)")
print(f"   - Total options: {total_options} (expected: 168)")
print(f"   - Trait balance: Each trait appears exactly 7 times")

db.close()