# server/migrate_sessions.py
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

# Handle postgresql:// vs postgres:// for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def migrate():
    print(f"Connecting to database: {DATABASE_URL.split('@')[-1]}")
    with engine.connect() as connection:
        try:
            print("Adding 'current_session_id' column to 'users' table...")
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_id VARCHAR;"))
            connection.commit()
            print("Migration successful!")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
