# update_timers.py
from database import SessionLocal
from models import Test

db = SessionLocal()
try:
    # Update DISC to 10 minutes (600 seconds)
    disc_updated = db.query(Test).filter(Test.code == "DISC").update({"time_limit": 600})
    # Update Temperament to 5 minutes (300 seconds)
    temp_updated = db.query(Test).filter(Test.code == "TEMP").update({"time_limit": 300})
    db.commit()
    print(f"Updated {disc_updated} DISC test(s).")
    print(f"Updated {temp_updated} Temperament test(s).")
except Exception as e:
    print("Error:", e)
    db.rollback()
finally:
    db.close()