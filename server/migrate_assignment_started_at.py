# server/migrate_assignment_started_at.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost/psych_db"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Checking for started_at column in assignments table...")
        try:
            conn.execute(text("ALTER TABLE assignments ADD COLUMN started_at TIMESTAMP WITHOUT TIME ZONE;"))
            conn.commit()
            print("Successfully added started_at column to assignments table.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column started_at already exists.")
            else:
                print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
