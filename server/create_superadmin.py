# server/create_superadmin.py
import sys
import os

# Ensure the script can find local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
from auth import hash_password

def create_super(username, password, full_name="Superadmin"):
    db = SessionLocal()
    try:
        # Check if username exists
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            print(f"Error: Username '{username}' already exists.")
            return

        new_super = User(
            username=username,
            full_name=full_name,
            password_hash=hash_password(password),
            role="superadmin",
            level="N/A"
        )
        db.add(new_super)
        db.commit()
        print(f"DONE: Superadmin '{username}' created successfully!")
    except Exception as e:
        print(f"FAILED: Failed to create superadmin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_superadmin.py <username> <password> [full_name]")
    else:
        uname = sys.argv[1]
        pword = sys.argv[2]
        fname = sys.argv[3] if len(sys.argv) > 3 else "Superadmin Owner"
        create_super(uname, pword, fname)
