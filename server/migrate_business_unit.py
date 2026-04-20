# server/migrate_business_unit.py
from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        # Check if business_unit column exists in users
        result = conn.execute(text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'business_unit')"
        ))
        col_exists = result.scalar()

        if not col_exists:
            print("Adding business_unit column to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN business_unit VARCHAR"))
            conn.commit()
            print("DONE: business_unit column added to users")
        else:
            print("ℹ️  business_unit column already exists in users")

if __name__ == "__main__":
    migrate()
