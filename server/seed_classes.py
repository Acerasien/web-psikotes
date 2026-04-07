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
        "name": "Karyawan Tetap",
        "description": "Karyawan tetap - standar ketat, waktu normal",
        "config": {
            "time_overrides": {
                "LOGIC": 900,    # 15 min
                "SPEED": 600,    # 10 min
                "MEM": 300,      # 5 min
                "DISC": 600,     # 10 min
                "TEMP": 600,     # 10 min
                "LEAD": 1800,    # 30 min (PAPI Kostick)
                # IQ not yet seeded - placeholder
            },
            "passing_grades": {
                # Will be filled when passing grade feature is activated
            },
        },
    },
    {
        "name": "Karyawan Kontrak",
        "description": "Karyawan kontrak - sedikit lebih longgar",
        "config": {
            "time_overrides": {
                "LOGIC": 1050,   # 17.5 min (+2.5 min)
                "SPEED": 720,    # 12 min (+2 min)
                "MEM": 360,      # 6 min (+1 min)
                "DISC": 720,     # 12 min (+2 min)
                "TEMP": 720,     # 12 min (+2 min)
                "LEAD": 2100,    # 35 min (+5 min)
            },
            "passing_grades": {},
        },
    },
    {
        "name": "Magang",
        "description": "Peserta magang - waktu lebih longgar, standar disesuaikan",
        "config": {
            "time_overrides": {
                "LOGIC": 1200,   # 20 min (+5 min)
                "SPEED": 900,    # 15 min (+5 min)
                "MEM": 420,      # 7 min (+2 min)
                "DISC": 780,     # 13 min (+3 min)
                "TEMP": 780,     # 13 min (+3 min)
                "LEAD": 2400,    # 40 min (+10 min)
            },
            "passing_grades": {},
        },
    },
    {
        "name": "Outsourcing",
        "description": "Tenaga outsourcing - standar dasar",
        "config": {
            "time_overrides": {
                "LOGIC": 1200,   # 20 min
                "SPEED": 900,    # 15 min
                "MEM": 420,      # 7 min
                "DISC": 780,     # 13 min
                "TEMP": 780,     # 13 min
                "LEAD": 2400,    # 40 min
            },
            "passing_grades": {},
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
        print(f"  ✏️  Updated: {class_data['name']}")
    else:
        # Create new
        new_class = ClassConfig(
            name=class_data["name"],
            description=class_data["description"],
            config=class_data["config"],
        )
        db.add(new_class)
        created += 1
        print(f"  ✅ Created: {class_data['name']}")

db.commit()

total = db.query(ClassConfig).count()
print(f"\n✅ Successfully seeded Class Configs!")
print(f"   - Created: {created}")
print(f"   - Updated: {updated}")
print(f"   - Total classes: {total}")

db.close()
