from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from database import get_db
from models import User, ExamSession, Assignment
from schemas import ExamSessionCreate, ExamSessionOut, ExamSessionStatus, ExamSessionUpdate
from auth import require_superadmin, get_current_user
from utils import get_now_jakarta

router = APIRouter(prefix="/admin/sessions", tags=["Exam Sessions"])

@router.post("/", response_model=ExamSessionOut)
def create_session(session_in: ExamSessionCreate, db: Session = Depends(get_db), admin: User = Depends(require_superadmin)):
    """Create a new exam session and link participants (superadmin only)"""
    new_session = ExamSession(
        name=session_in.name,
        start_time=session_in.start_time,
        end_time=session_in.end_time,
        is_unlocked=session_in.is_unlocked
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Link participants' assignments to this session
    if session_in.participant_ids:
        db.query(Assignment).filter(
            Assignment.user_id.in_(session_in.participant_ids),
            Assignment.status == "pending"
        ).update({"session_id": new_session.id}, synchronize_session=False)
        db.commit()

    return new_session

@router.get("/", response_model=List[ExamSessionOut])
def list_sessions(db: Session = Depends(get_db), admin: User = Depends(require_superadmin)):
    """List all exam sessions (superadmin only)"""
    sessions = db.query(ExamSession).order_by(ExamSession.start_time.desc()).all()
    
    # Add participant count dynamically for each session
    for s in sessions:
        # Get participant IDs for this session
        p_ids = db.query(Assignment.user_id).filter(Assignment.session_id == s.id).distinct().all()
        s.participant_ids = [pid[0] for pid in p_ids]
        s.participant_count = len(s.participant_ids)
    
    return sessions

@router.get("/{session_id}", response_model=ExamSessionOut)
def get_session(session_id: int, db: Session = Depends(get_db), admin: User = Depends(require_superadmin)):
    """Get a single session details"""
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    p_ids = db.query(Assignment.user_id).filter(Assignment.session_id == session.id).distinct().all()
    session.participant_ids = [pid[0] for pid in p_ids]
    session.participant_count = len(session.participant_ids)
    return session

@router.put("/{session_id}", response_model=ExamSessionOut)
def update_session(session_id: int, session_in: ExamSessionUpdate, db: Session = Depends(get_db), admin: User = Depends(require_superadmin)):
    """Update session details and participants"""
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_in.name is not None: session.name = session_in.name
    if session_in.start_time is not None: session.start_time = session_in.start_time
    if session_in.end_time is not None: session.end_time = session_in.end_time
    if session_in.is_unlocked is not None: session.is_unlocked = session_in.is_unlocked

    db.commit()

    if session_in.participant_ids is not None:
        # 1. Unlink existing participants NOT in the new list (who are assigned to THIS session)
        db.query(Assignment).filter(
            Assignment.session_id == session_id,
            Assignment.user_id.notin_(session_in.participant_ids)
        ).update({"session_id": None}, synchronize_session=False)

        # 2. Link new participants (if they are currently "pending" and not in a session)
        db.query(Assignment).filter(
            Assignment.user_id.in_(session_in.participant_ids),
            Assignment.session_id.is_(None), # only link if not already in another session
            Assignment.status == "pending"
        ).update({"session_id": session_id}, synchronize_session=False)

        db.commit()

    # Re-fetch for return
    p_ids = db.query(Assignment.user_id).filter(Assignment.session_id == session.id).distinct().all()
    session.participant_ids = [pid[0] for pid in p_ids]
    session.participant_count = len(session.participant_ids)
    return session

@router.post("/{session_id}/unlock")
def toggle_session_unlock(session_id: int, db: Session = Depends(get_db), admin: User = Depends(require_superadmin)):
    """Toggle the master unlock flag for a session"""
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_unlocked = not session.is_unlocked
    db.commit()
    return {"message": "Session updated", "is_unlocked": session.is_unlocked}

@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db), admin: User = Depends(require_superadmin)):
    """Delete a session and unlink assignments"""
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Unlink assignments
    db.query(Assignment).filter(Assignment.session_id == session_id).update({"session_id": None})
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

# Participant-facing status route
@router.get("/status/{assignment_id}", response_model=ExamSessionStatus)
def get_assignment_session_status(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get the session status for a specific assignment (participant view)"""
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if not assignment.session_id:
        return {
            "id": 0,
            "name": "No Session",
            "is_open": True,
            "is_unlocked": True,
            "seconds_until_start": 0,
            "start_time": get_now_jakarta(),
            "end_time": None
        }
    
    session = assignment.session
    now = get_now_jakarta()
    
    is_open = now >= session.start_time or session.is_unlocked
    seconds_until_start = int((session.start_time - now).total_seconds()) if now < session.start_time else 0
    
    return {
        "id": session.id,
        "name": session.name,
        "is_open": is_open,
        "is_unlocked": session.is_unlocked,
        "seconds_until_start": seconds_until_start,
        "start_time": session.start_time,
        "end_time": session.end_time
    }
