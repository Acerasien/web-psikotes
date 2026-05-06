# server/migrate_user_created_at.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables from .env file
load_dotenv()

# Use the database URL from environment or fallback to default
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:21453@localhost/psych_db"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Checking for created_at column in users table...")
        
        # 1. Add column
        try:
            # Use raw SQL to add the column. 
            # We don't use 'IF NOT EXISTS' here because older Postgres versions don't support it for ADD COLUMN,
            # instead we catch the exception if it already exists.
            conn.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE;"))
            conn.commit()
            print("DONE: Successfully added created_at column to users table.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("INFO: Column created_at already exists.")
            else:
                print(f"ERROR adding column: {e}")
                return

        # 2. Backfill existing records with current timestamp
        # This ensures existing users aren't left with a NULL date which would break sorting.
        try:
            print("Backfilling existing records...")
            conn.execute(text("UPDATE users SET created_at = NOW() WHERE created_at IS NULL;"))
            conn.commit()
            print("DONE: Successfully backfilled existing records.")
        except Exception as e:
            print(f"ERROR backfilling: {e}")

        # 3. Add index for performance
        # Sorting 100+ or 1000+ records by date is much faster with an index.
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_created_at ON users (created_at);"))
            conn.commit()
            print("DONE: Successfully added index on created_at.")
        except Exception as e:
            print(f"ERROR adding index: {e}")

if __name__ == "__main__":
    migrate()
