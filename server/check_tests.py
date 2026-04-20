from database import SessionLocal
from models import Test

db = SessionLocal()
tests = db.query(Test).all()
print("Tests in DB:")
for t in tests:
    print(f"- Name: '{t.name}', Code: '{t.code}'")
db.close()
