# server/migrate_exam_scheduler.py
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Try parent directory .env
    load_dotenv("../.env")
    DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

# Handle postgresql:// vs postgres:// for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def migrate():
    print(f"Connecting to database...")
    with engine.connect() as connection:
        # 1. Create exam_sessions table
        print("Creating 'exam_sessions' table...")
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS exam_sessions (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                is_unlocked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # 2. Add session_id to assignments
        print("Adding 'session_id' column to 'assignments' table...")
        try:
            connection.execute(text("ALTER TABLE assignments ADD COLUMN session_id INTEGER REFERENCES exam_sessions(id) ON DELETE SET NULL;"))
            print("Successfully added session_id column.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column 'session_id' already exists, skipping.")
            else:
                print(f"Error adding column: {e}")

        connection.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
