# server/seed.py
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from models import User
from auth import hash_password

# ---------------------------------------------------
# THIS LINE CREATES ALL TABLES IF THEY DON'T EXIST
# ---------------------------------------------------
Base.metadata.create_all(bind=engine)
# ---------------------------------------------------

db: Session = SessionLocal()

admin_user = db.query(User).filter(User.username == "admin").first()

if not admin_user:
    print("Creating superadmin user...")
    
    new_admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        role="superadmin",                # <-- CHANGE THIS
        full_name="System Administrator"
    )
    
    db.add(new_admin)
    db.commit()
    print("Superadmin user created! Username: admin | Password: admin123")
else:
    print("Admin user already exists.")

# After creating superadmin, optionally create a test admin
test_admin = db.query(User).filter(User.username == "testadmin").first()
if not test_admin:
    test_admin = User(
        username="testadmin",
        password_hash=hash_password("admin123"),
        role="admin",
        full_name="Test Admin"
    )
    db.add(test_admin)
    db.commit()
    print("Test admin created! Username: testadmin | Password: admin123")

db.close()