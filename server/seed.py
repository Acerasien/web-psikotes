# server/seed.py
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine # Import Base and engine
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
    print("Creating admin user...")
    
    new_admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        role="admin",
        full_name="System Administrator"
    )
    
    db.add(new_admin)
    db.commit()
    print("Admin user created! Username: admin | Password: admin123")
else:
    print("Admin user already exists.")

db.close()