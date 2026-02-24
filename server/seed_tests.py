# server/seed_tests.py
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Test, Question, Option

db: Session = SessionLocal()

# Check if Speed Test already exists
existing_test = db.query(Test).filter(Test.code == "SPEED").first()

if not existing_test:
    print("Seeding Speed Test...")
    
    # 1. Create the Test
    speed_test = Test(
        name="Speed Test",
        code="SPEED",
        time_limit=600, # 10 minutes
        settings={"type": "speed", "randomize_options": True}
    )
    db.add(speed_test)
    db.commit()
    db.refresh(speed_test)

    # 2. Define Questions and Options
    questions_data = [
        {
            "content": "Which pair is exactly the same?",
            "order_index": 1,
            "options": [
                {"label": "A", "content": "A78K || A78K", "scoring_logic": {"correct": True}},
                {"label": "B", "content": "B45M || B54M", "scoring_logic": {"correct": False}},
                {"label": "C", "content": "C19P || C19R", "scoring_logic": {"correct": False}},
                {"label": "D", "content": "D82Q || D28Q", "scoring_logic": {"correct": False}}
            ]
        },
        {
            "content": "Which pair is exactly the same?",
            "order_index": 2,
            "options": [
                {"label": "A", "content": "X91Y || X19Y", "scoring_logic": {"correct": False}},
                {"label": "B", "content": "Z55T || Z55T", "scoring_logic": {"correct": True}},
                {"label": "C", "content": "P12M || P21M", "scoring_logic": {"correct": False}},
                {"label": "D", "content": "L88N || L8N8", "scoring_logic": {"correct": False}}
            ]
        }
    ]

    # 3. Insert Questions and Options
    for q_data in questions_data:
        new_question = Question(
            test_id=speed_test.id,
            content=q_data["content"],
            order_index=q_data["order_index"]
        )
        db.add(new_question)
        db.commit()
        db.refresh(new_question)

        for opt_data in q_data["options"]:
            new_option = Option(
                question_id=new_question.id,
                label=opt_data["label"],
                content=opt_data["content"],
                scoring_logic=opt_data["scoring_logic"]
            )
            db.add(new_option)
    
    db.commit()
    print("Speed Test seeded successfully!")
else:
    print("Speed Test already exists.")

db.close()