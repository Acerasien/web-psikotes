# server/test_session_backend.py
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def test():
    with engine.connect() as conn:
        # Find a participant
        user = conn.execute(text("SELECT id, username FROM users WHERE role = 'participant' LIMIT 1")).fetchone()
        if not user:
            print("No participants found.")
            return
        
        user_id, username = user
        print(f"Found participant: {username} (ID: {user_id})")

        # Create session
        start_time = datetime.utcnow() + timedelta(hours=1)
        name = "Backend Test Session"
        
        print(f"Creating session '{name}' starting at {start_time}...")
        res = conn.execute(text("""
            INSERT INTO exam_sessions (name, start_time, is_unlocked)
            VALUES (:name, :start_time, FALSE)
            RETURNING id
        """), {"name": name, "start_time": start_time})
        session_id = res.fetchone()[0]
        
        # Link assignment
        # Check if user has assignments
        assignment = conn.execute(text("SELECT id FROM assignments WHERE user_id = :user_id LIMIT 1"), {"user_id": user_id}).fetchone()
        if assignment:
            assignment_id = assignment[0]
            print(f"Linking assignment {assignment_id} to session {session_id}...")
            conn.execute(text("UPDATE assignments SET session_id = :session_id WHERE id = :assignment_id"), 
                         {"session_id": session_id, "assignment_id": assignment_id})
        
        conn.commit()
        print("Success! Session created and linked.")

if __name__ == "__main__":
    test()
