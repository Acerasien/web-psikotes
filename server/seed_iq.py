# server/seed_iq.py
"""
Seeder for IQ Test (CFIT-style, 8 phases, 100 questions)

Reads answers from iq_answers_template.json and creates:
- Test container (code="IQ")
- 8 Phase records (order 1-8, with timers)
- 100 Question records (with phase_id)
- ~500+ Option records (with correct answers)
"""
import json
import os
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Phase, Question, Option

db: Session = SessionLocal()

# ============================================================
# Configuration
# ============================================================

PHASE_CONFIG = {
    1: {"questions": 13, "timer": 180, "options": 6, "type": "single"},       # a-f
    2: {"questions": 14, "timer": 240, "options": 5, "type": "multi_select"},  # a-e, odd-one-out
    3: {"questions": 13, "timer": 180, "options": 6, "type": "single"},       # a-f
    4: {"questions": 10, "timer": 180, "options": 5, "type": "single"},       # a-e
    5: {"questions": 13, "timer": 180, "options": 6, "type": "single"},       # a-f
    6: {"questions": 14, "timer": 240, "options": 5, "type": "multi_select"},  # a-e, odd-one-out
    7: {"questions": 13, "timer": 180, "options": 6, "type": "single"},       # a-f
    8: {"questions": 10, "timer": 180, "options": 5, "type": "single"},       # a-e
}

# Fixed text for Phase 2 & 6
FIXED_QUESTION_TEXT = "Pilih 2 gambar yang berbeda:"

# Practice question instruction text per phase (from TUTORIAL_CONTENT.md)
PHASE_INSTRUCTIONS = {
    1: (
        "Pada layar akan ditampilkan serangkaian gambar dalam bentuk urutan tertentu, "
        "di mana gambar pada kotak terakhir masih kosong. "
        "Tugas Anda adalah menentukan gambar yang tepat untuk melengkapi kotak kosong tersebut. "
        "Pilih satu jawaban yang paling sesuai dari enam pilihan yang tersedia (A, B, C, D, E, atau F). "
        "Perhatikan bahwa setiap rangkaian gambar memiliki pola tertentu. "
        "Oleh karena itu, Anda perlu memahami pola perubahan yang terjadi pada gambar-gambar sebelumnya "
        "sebelum menentukan jawaban."
    ),
    2: (
        "Pada setiap soal, Anda akan melihat lima gambar yang disusun secara berdampingan. "
        "Tugas Anda adalah memilih dua gambar yang memiliki kesamaan karakteristik atau pola. "
        "Tiga gambar lainnya merupakan pengecoh. "
        "Perhatikan setiap gambar dengan cermat agar dapat mengidentifikasi kesamaan yang paling tepat."
    ),
    3: (
        "Pada setiap soal, terdapat sebuah kotak besar yang berisi beberapa kotak kecil dengan pola atau gambar tertentu. "
        "Salah satu bagian, yaitu kotak di bagian kanan bawah, masih kosong (Kotak garis putus-putus). "
        "Tugas Anda adalah memilih satu jawaban yang paling tepat dari lima pilihan yang tersedia "
        "untuk melengkapi bagian yang kosong tersebut, berdasarkan pola yang ada."
    ),
    4: (
        "Perhatikan contoh soal yang diberikan. Setiap gambar memiliki karakteristik tertentu, "
        "dan pada gambar terdapat titik hitam tebal. "
        "Tugas Anda adalah mencari gambar yang memiliki titik hitam, di mana titik hitam tersebut "
        "bisa berada pada dua gambar sekaligus. "
        "Perlu diperhatikan bahwa titik hitam tersebut dapat muncul pada lebih dari satu gambar."
    ),
    5: (
        "Pada layar akan ditampilkan serangkaian gambar dalam bentuk urutan tertentu, "
        "di mana gambar pada kotak terakhir masih kosong. "
        "Tugas Anda adalah menentukan gambar yang tepat untuk melengkapi kotak kosong tersebut. "
        "Pilih satu jawaban yang paling sesuai dari enam pilihan yang tersedia (A, B, C, D, E, atau F). "
        "Perhatikan bahwa setiap rangkaian gambar memiliki pola tertentu. "
        "Oleh karena itu, Anda perlu memahami pola perubahan yang terjadi pada gambar-gambar sebelumnya "
        "sebelum menentukan jawaban."
    ),
    6: (
        "Pada setiap soal, Anda akan melihat lima gambar yang disusun secara berdampingan. "
        "Tugas Anda adalah memilih dua gambar yang memiliki kesamaan karakteristik atau pola. "
        "Tiga gambar lainnya merupakan pengecoh. "
        "Perhatikan setiap gambar dengan cermat agar dapat mengidentifikasi kesamaan yang paling tepat."
    ),
    7: (
        "Pada setiap soal, terdapat sebuah kotak besar yang berisi beberapa kotak kecil dengan pola atau gambar tertentu. "
        "Salah satu bagian, yaitu kotak di bagian kanan bawah, masih kosong (Kotak garis putus-putus). "
        "Tugas Anda adalah memilih satu jawaban yang paling tepat dari lima pilihan yang tersedia "
        "untuk melengkapi bagian yang kosong tersebut, berdasarkan pola yang ada."
    ),
    8: (
        "Perhatikan contoh soal yang diberikan. Setiap gambar memiliki karakteristik tertentu, "
        "dan pada gambar terdapat titik hitam tebal. "
        "Tugas Anda adalah mencari gambar yang memiliki titik hitam, di mana titik hitam tersebut "
        "bisa berada pada dua gambar sekaligus. "
        "Perlu diperhatikan bahwa titik hitam tersebut dapat muncul pada lebih dari satu gambar."
    ),
}

# Practice question template (generic explanation for feedback)
PRACTICE_EXPLANATIONS = {
    "single": "Perhatikan pola yang terbentuk pada gambar, lalu pilih jawaban yang paling tepat.",
    "multi_select": "Perhatikan baik-baik, ada 2 gambar yang berbeda dari pola yang lain.",
}

# ============================================================
# Load scored answers
# ============================================================

answers_path = os.path.join(os.path.dirname(__file__), "iq_answers_template.json")
with open(answers_path, "r") as f:
    answers_data = json.load(f)

answer_map = {}  # {(phase, q_number): answer}
for phase_info in answers_data["phases"]:
    phase_num = phase_info["phase"]
    for q in phase_info["questions"]:
        answer_map[(phase_num, q["number"])] = q["answer"]

# ============================================================
# Load practice answers
# ============================================================

practice_answers_path = os.path.join(os.path.dirname(__file__), "iq_practice_answers.json")
with open(practice_answers_path, "r") as f:
    practice_answers_data = json.load(f)

practice_answer_map = {}  # {(phase, q_number): answer}
for phase_info in practice_answers_data["phases"]:
    phase_num = phase_info["phase"]
    for q in phase_info["questions"]:
        practice_answer_map[(phase_num, q["number"])] = q["answer"]

# ============================================================
# 1. Find or create the IQ test
# ============================================================

iq_test = db.query(Test).filter(Test.code == "IQ").first()

if not iq_test:
    iq_test = Test(
        name="Test IQ ( POLA )",
        code="IQ",
        time_limit=0,  # No global timer — per-phase timers
        settings={"type": "iq", "passing_score": None},
    )
    db.add(iq_test)
    db.commit()
    db.refresh(iq_test)
    print("Created IQ Test container.")
else:
    # Clear old data
    from models import Response, Result
    old_qs = db.query(Question).filter(Question.test_id == iq_test.id).all()
    old_q_ids = [q.id for q in old_qs]
    if old_q_ids:
        from models import Response, Result, ExitLog, Assignment
        db.query(Response).filter(Response.test_id == iq_test.id).delete(synchronize_session=False)
        db.query(Result).filter(Result.test_id == iq_test.id).delete(synchronize_session=False)
        db.query(ExitLog).filter(
            ExitLog.assignment_id.in_(
                db.query(Assignment.id).filter(Assignment.test_id == iq_test.id)
            )
        ).delete(synchronize_session=False)
        db.query(Assignment).filter(Assignment.test_id == iq_test.id).delete(synchronize_session=False)
        db.commit()
        db.query(Option).filter(Option.question_id.in_(old_q_ids)).delete(synchronize_session=False)
        db.commit()
    db.query(Question).filter(Question.test_id == iq_test.id).delete()
    db.query(Phase).filter(Phase.test_id == iq_test.id).delete()
    db.commit()
    print("Cleared old IQ test data.")

# ============================================================
# 2. Create phases
# ============================================================

print("Creating 8 phases...")
phase_map = {}  # {phase_order: Phase}

for order in range(1, 9):
    config = PHASE_CONFIG[order]
    p = Phase(
        test_id=iq_test.id,
        order_number=order,
        timer_seconds=config["timer"],
        practice_questions=[],  # Will be populated below
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    phase_map[order] = p
    print(f"  Phase {order}: timer={config['timer']}s, type={config['type']}")

# ============================================================
# 2b. Populate practice questions from image files
# ============================================================

import glob as glob_module
import re

print("Populating practice questions from images...")
practice_dir = os.path.join(os.path.dirname(__file__), "..", "client", "public", "images", "iq", "practice")

for phase_order in range(1, 9):
    config = PHASE_CONFIG[phase_order]
    phase = phase_map[phase_order]
    is_multi = config["type"] == "multi_select"
    num_options = config["options"]

    # Find all practice question numbers for this phase
    # Pattern: iq_practice_phase{N}_q{NN}_question.png (or just options for multi phases)
    if is_multi:
        # Phase 2 & 6: no _question.png, just options
        pattern = os.path.join(practice_dir, f"iq_practice_phase{phase_order}_q*_a.png")
    else:
        pattern = os.path.join(practice_dir, f"iq_practice_phase{phase_order}_q*_question.png")

    files = glob_module.glob(pattern)

    # Extract question numbers
    q_nums = []
    for f in files:
        basename = os.path.basename(f)
        match = re.search(r'q(\d+)', basename)
        if match:
            q_nums.append(int(match.group(1)))

    q_nums.sort()

    if not q_nums:
        print(f"  Phase {phase_order}: No practice images found, using placeholder")
        # Create instruction + minimal placeholder practice question
        instruction = PHASE_INSTRUCTIONS.get(phase_order, "Perhatikan gambar berikut.")
        explanation = PRACTICE_EXPLANATIONS["multi_select" if is_multi else "single"]
        practice_questions = [
            {
                "content": instruction,
                "options": [],
                "correct_index": 0 if not is_multi else [0, 1],
                "explanation": explanation,
                "is_instruction": True,
            },
            {
                "content": instruction,
                "options": [f"<div>Opsi {chr(65+i)}</div>" for i in range(num_options)],
                "correct_index": 0 if not is_multi else [0, 1],
                "explanation": explanation,
            }
        ]
    else:
        print(f"  Phase {phase_order}: Found {len(q_nums)} practice questions (q{q_nums})")
        practice_questions = []

        # Add instruction as the first practice item (no options, auto-advance)
        instruction = PHASE_INSTRUCTIONS.get(phase_order, "Perhatikan gambar berikut.")
        explanation = PRACTICE_EXPLANATIONS["multi_select" if is_multi else "single"]

        practice_questions.append({
            "content": instruction,
            "options": [],
            "correct_index": 0,
            "explanation": explanation,
            "is_instruction": True,
        })

        for q_num in q_nums:
            # Build content
            if is_multi:
                content = FIXED_QUESTION_TEXT
            else:
                content = f"<img src='/images/iq/practice/iq_practice_phase{phase_order}_q{q_num:02d}_question.png' class='question-image' />"

            # Build options
            option_labels = ["a", "b", "c", "d", "e", "f"][:num_options]
            options = []
            for label in option_labels:
                options.append(f"<img src='/images/iq/practice/iq_practice_phase{phase_order}_q{q_num:02d}_{label}.png' />")

            # Get correct answer from practice answer file
            answer = practice_answer_map.get((phase_order, q_num))
            if answer:
                if is_multi:
                    correct_index = [ord(c) - ord('a') for c in answer]
                else:
                    correct_index = ord(answer) - ord('a')
            else:
                # Fallback: first option(s)
                correct_index = 0 if not is_multi else [0, 1]
                print(f"  WARNING: Phase {phase_order} Q{q_num}: No practice answer found, using default")

            explanation = PRACTICE_EXPLANATIONS["multi_select" if is_multi else "single"]

            practice_questions.append({
                "content": content,
                "options": options,
                "correct_index": correct_index,
                "explanation": explanation,
            })

    phase.practice_questions = practice_questions
    db.commit()
    print(f"  Phase {phase_order}: {len(practice_questions)} practice questions saved")

# ============================================================
# 3. Create questions and options
# ============================================================

total_questions = 0
total_options = 0

for phase_order in range(1, 9):
    config = PHASE_CONFIG[phase_order]
    phase = phase_map[phase_order]
    num_questions = config["questions"]
    num_options = config["options"]
    is_multi = config["type"] == "multi_select"
    option_labels = ["a", "b", "c", "d", "e", "f"][:num_options]

    print(f"Seeding Phase {phase_order} ({num_questions} questions, {num_options} options each)...")

    for q_num in range(1, num_questions + 1):
        # Build question content
        if is_multi:
            # Phase 2 & 6: fixed text, image options only
            content = FIXED_QUESTION_TEXT
        else:
            # Other phases: image-based question stem
            content = f"<img src='/images/iq/scored/iq_phase{phase_order}_q{q_num:02d}_question.png' class='question-image' />"

        q = Question(
            test_id=iq_test.id,
            phase_id=phase.id,
            content=content,
            order_index=q_num,
            meta_data={"multi_select": True} if is_multi else None,
        )
        db.add(q)
        db.commit()
        db.refresh(q)

        # Get correct answer
        answer = answer_map.get((phase_order, q_num))
        if is_multi:
            # Multi-select: answer is a list like ["b", "e"]
            correct_labels = set(answer)
        else:
            # Single: answer is a string like "c"
            correct_labels = {answer}

        # Create options
        for label in option_labels:
            is_correct = label in correct_labels
            opt_content = f"<img src='/images/iq/scored/iq_phase{phase_order}_q{q_num:02d}_{label}.png' />"

            opt = Option(
                question_id=q.id,
                label=label.upper(),
                content=opt_content,
                scoring_logic={"correct": is_correct},
            )
            db.add(opt)
            total_options += 1

        total_questions += 1

    db.commit()

# ============================================================
# Summary
# ============================================================

print(f"\nIQ Test seeded successfully!")
print(f"  Test: {iq_test.name} (code={iq_test.code})")
print(f"  Phases: 8")
print(f"  Questions: {total_questions}")
print(f"  Options: {total_options}")

db.close()
