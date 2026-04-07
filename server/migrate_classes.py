"""
Migration: Add ClassConfig table and class_id to users.
Run once: python migrate_classes.py
"""
from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        # Check if class_configs table exists
        result = conn.execute(text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_configs')"
        ))
        table_exists = result.scalar()

        if not table_exists:
            print("Creating class_configs table...")
            conn.execute(text("""
                CREATE TABLE class_configs (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR UNIQUE NOT NULL,
                    description VARCHAR,
                    config JSON NOT NULL DEFAULT '{}'
                );
                CREATE INDEX ix_class_configs_name ON class_configs (name);
            """))
            conn.commit()
            print("✅ class_configs table created")
        else:
            print("ℹ️  class_configs table already exists")

        # Check if class_id column exists in users
        result = conn.execute(text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'class_id')"
        ))
        col_exists = result.scalar()

        if not col_exists:
            print("Adding class_id column to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN class_id INTEGER REFERENCES class_configs(id)"))
            conn.execute(text("CREATE INDEX ix_users_class_id ON users (class_id)"))
            conn.commit()
            print("✅ class_id column added to users")
        else:
            print("ℹ️  class_id column already exists in users")

        print("\n✅ Migration complete. Run seed_classes.py to populate classes.")

if __name__ == "__main__":
    migrate()
