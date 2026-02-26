# server/migrate_superadmin.py
from database import SessionLocal
from models import User

db = SessionLocal()
try:
    # Convert all users with role 'admin' to 'superadmin'
    result = db.query(User).filter(User.role == "admin").update({"role": "superadmin"})
    db.commit()
    print(f"Updated {result} user(s) from 'admin' to 'superadmin'.")
except Exception as e:
    print("Error:", e)
    db.rollback()
finally:
    db.close()