# server/seed.py
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User
from auth import hash_password
import enum

# We need to define the Enum again here or import it if we refactor later
class UserRole(enum.Enum):
    admin = "admin"
    participant = "participant"

# Create a database session
db: Session = SessionLocal()

# Check if admin already exists
admin_user = db.query(User).filter(User.username == "admin").first()

if not admin_user:
    print("Creating admin user...")
    
    # Create the admin
    new_admin = User(
        username="admin",
        password_hash=hash_password("admin123"), # Default password
        role=UserRole.admin.value,
        full_name="System Administrator"
    )
    
    db.add(new_admin)
    db.commit()
    print("Admin user created! Username: admin | Password: admin123")
else:
    print("Admin user already exists.")

db.close()