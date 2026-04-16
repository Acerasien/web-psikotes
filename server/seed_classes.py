# server/seed_classes.py
"""
Seed class configurations (time overrides + passing grades placeholder).
Idempotent - safe to re-run. Creates/updates 4 classes.
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ClassConfig

db: Session = SessionLocal()

classes_data = [
    {
        "name": "HO Staff",
        "description": "Head Office Staff",
        "config": {
            "time_overrides": {
                "SPEED": 600, "DISC": 420, "LOGIC": 720, "LEAD": 720, "TEMP": 300, "CBI": 900,
                "MEM": {"encoding": 180, "recall": 600},
                "IQ": {"phases": [180, 240, 180, 180, 180, 240, 180, 180]}
            }
        },
    },
    {
        "name": "HO Non Staff",
        "description": "Head Office Non Staff",
        "config": {
            "time_overrides": {
                "SPEED": 600, "DISC": 420, "LOGIC": 720, "LEAD": 720, "TEMP": 300, "CBI": 900,
                "MEM": {"encoding": 180, "recall": 600},
                "IQ": {"phases": [240, 300, 240, 240, 240, 300, 240, 240]}
            }
        },
    },
    {
        "name": "Site Staff",
        "description": "Site-based Staff",
        "config": {
            "time_overrides": {
                "SPEED": 600, "DISC": 420, "LOGIC": 720, "LEAD": 720, "TEMP": 300, "CBI": 900,
                "MEM": {"encoding": 180, "recall": 600},
                "IQ": {"phases": [180, 240, 180, 180, 180, 240, 180, 180]}
            }
        },
    },
    {
        "name": "Site Non Staff",
        "description": "Site-based Non Staff",
        "config": {
            "time_overrides": {
                "SPEED": 780, "DISC": 600, "LOGIC": 900, "LEAD": 900, "TEMP": 360, "CBI": 1080,
                "MEM": {"encoding": 300, "recall": 600},
                "IQ": {"phases": [300, 360, 300, 300, 300, 360, 300, 300]}
            }
        },
    },
    {
        "name": "Site Operator",
        "description": "Site-based Operator",
        "config": {
            "time_overrides": {
                "SPEED": 780, "DISC": 600, "LOGIC": 900, "LEAD": 900, "TEMP": 360, "CBI": 1080,
                "MEM": {"encoding": 300, "recall": 600},
                "IQ": {"phases": [300, 360, 300, 300, 300, 360, 300, 300]}
            }
        },
    },
    {
        "name": "Internship",
        "description": "Internship Program",
        "config": {
            "time_overrides": {
                "SPEED": 600, "DISC": 420, "LOGIC": 720, "LEAD": 720, "TEMP": 300, "CBI": 900,
                "MEM": {"encoding": 180, "recall": 600},
                "IQ": {"phases": [180, 240, 180, 180, 180, 240, 180, 180]}
            }
        },
    },
]

print("Seeding Class Configs...")

created = 0
updated = 0

for class_data in classes_data:
    existing = db.query(ClassConfig).filter(ClassConfig.name == class_data["name"]).first()

    if existing:
        # Update existing
        existing.description = class_data["description"]
        existing.config = class_data["config"]
        updated += 1
        print(f"  [Updated] {class_data['name']}")
    else:
        # Create new
        new_class = ClassConfig(
            name=class_data["name"],
            description=class_data["description"],
            config=class_data["config"],
        )
        db.add(new_class)
        created += 1
        print(f"  [Created] {class_data['name']}")

db.commit()

total = db.query(ClassConfig).count()
print(f"\nSuccessfully seeded Class Configs!")
print(f"   - Created: {created}")
print(f"   - Updated: {updated}")
print(f"   - Total classes: {total}")

db.close()
