import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    """Add report_decisions column to users table"""
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if column exists
        cur.execute("""
            SELECT count(*) 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='report_decisions';
        """)
        
        if cur.fetchone()[0] == 0:
            print("Adding 'report_decisions' column to 'users' table...")
            cur.execute("ALTER TABLE users ADD COLUMN report_decisions JSONB;")
            conn.commit()
            print("Migration successful!")
        else:
            print("Column 'report_decisions' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
