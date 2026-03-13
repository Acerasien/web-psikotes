"""
Assignment routes - Assignment management, test taking, and submission
"""
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, date
import csv
import io

from auth import require_admin, require_superadmin, get_current_user, hash_password
from database import get_db
from models import User, Test, Assignment, Result, Question, Option, ExitLog, Response
from schemas import TestSubmission

# Import scoring functions
from scoring.disc import score_disc
from scoring.speed import score_speed
from scoring.temperament import score_temperament
from scoring.memory import score_memory
from scoring.logic import score_logic
from scoring.leadership import score_leadership

# Import helper
from utils import get_max_score

router = APIRouter(tags=["assignments"])


# ==================== ASSIGNMENT CRUD ====================

@router.get("/assignments/")
def get_assignments(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get assignments with optional user_id filter"""
    query = db.query(Assignment)
    if user_id is not None:
        query = query.filter(Assignment.user_id == user_id)
    assignments = query.all()
    result = []
    for a in assignments:
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "username": a.user.username,
            "full_name": a.user.full_name,
            "test_id": a.test_id,
            "test_name": a.test.name,
            "status": a.status,
            "assigned_at": a.assigned_at
        })
    return result


@router.post("/assignments/", status_code=201)
def create_assignment(
    user_id: int,
    test_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Assign a test to a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    existing = db.query(Assignment).filter(Assignment.user_id == user_id, Assignment.test_id == test_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Test already assigned to this user")
    new_assignment = Assignment(user_id=user_id, test_id=test_id)
    db.add(new_assignment)
    db.commit()
    return {"message": "Test assigned successfully"}


@router.get("/users/me/assignments")
def get_my_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get current user's assignments"""
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id).all()
    result = []
    for a in assignments:
        result.append({
            "id": a.id,
            "test_id": a.test_id,
            "test_name": a.test.name,
            "test_code": a.test.code,
            "status": a.status,
            "pretest_completed": a.pretest_completed,
            "assigned_at": a.assigned_at
        })
    return result


@router.get("/assignments/{assignment_id}/start")
def start_test(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a test - get questions for an assignment"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if assignment.status == "locked":
        raise HTTPException(status_code=403, detail="This test is locked due to a security violation. Please contact the administrator.")
    if assignment.status == "pending":
        assignment.status = "in_progress"
        db.commit()
    questions = db.query(Question).filter(Question.test_id == assignment.test_id).order_by(Question.order_index).all()
    output = []
    for q in questions:
        options_data = []
        for opt in q.options:
            options_data.append({
                "id": opt.id,
                "label": opt.label,
                "content": opt.content
            })
        output.append({
            "id": q.id,
            "content": q.content,
            "order": q.order_index,
            "options": options_data
        })
    return {
        "test_name": assignment.test.name,
        "time_limit": assignment.test.time_limit,
        "settings": assignment.test.settings,
        "questions": output
    }


@router.post("/assignments/{assignment_id}/submit")
def submit_test(
    assignment_id: int,
    submission: TestSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit test answers and get scored"""
    # 1. Find the assignment
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if assignment.status != "in_progress":
        raise HTTPException(status_code=400, detail="Test is not in progress")
    
    # Check if result already exists (prevent duplicate submissions)
    existing_result = db.query(Result).filter(
        Result.assignment_id == assignment_id,
        Result.user_id == current_user.id
    ).first()
    if existing_result:
        raise HTTPException(
            status_code=400, 
            detail="This test has already been submitted. Duplicate submissions are not allowed."
        )

    # 2. Save all responses
    for ans in submission.answers:
        resp = Response(
            user_id=current_user.id,
            test_id=assignment.test_id,
            assignment_id=assignment.id,
            question_id=ans["question_id"],
            selected_option_id=ans.get("option_id"),
            selection_type=ans.get("type", "single"),
        )
        db.add(resp)

    # 3. Score based on test code
    test_code = assignment.test.code
    score = 0
    details = None

    if test_code == "DISC":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        details = score_disc(submission.answers, questions)
        score = len({ans["question_id"] for ans in submission.answers})

    elif test_code == "SPEED":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        details = score_speed(submission.answers, questions)
        score = details["score"]

    elif test_code == "TEMP":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        details = score_temperament(submission.answers, questions)
        score = sum(details["raw_scores"].values()) if details["raw_scores"] else 0

    elif test_code == "MEM":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        details = score_memory(submission.answers, questions)
        score = details["score"]

    elif test_code == "LOGIC":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        details = score_logic(submission.answers, questions)
        score = details["score"]

    elif test_code == "LEAD":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        details = score_leadership(submission.answers, questions)
        score = sum(details["raw_scores"].values())

    else:
        # Default: simple correct count
        for ans in submission.answers:
            if ans.get("type", "single") == "single":
                option = db.query(Option).filter(Option.id == ans["option_id"]).first()
                if option and option.scoring_logic.get("correct"):
                    score += 1

    # 4. Create Result record
    result = Result(
        user_id=current_user.id,
        test_id=assignment.test_id,
        assignment_id=assignment.id,
        score=score,
        time_taken=submission.time_taken,
        details=details,
        completed_at=datetime.utcnow()
    )
    db.add(result)

    # 5. Mark assignment as completed
    assignment.status = "completed"
    db.commit()

    return {
        "message": "Test submitted successfully",
        "score": score,
        "test_type": test_code
    }


@router.post("/assignments/{assignment_id}/lock")
def lock_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lock assignment due to security violation"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.status = "locked"
    db.commit()
    return {"message": "Assignment locked due to integrity violation"}


@router.post("/admin/assignments/{assignment_id}/unlock")
def unlock_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    """Unlock an assignment (superadmin only)"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.status = "in_progress"
    db.commit()
    return {"message": "Assignment unlocked"}


@router.post("/admin/assignments/{assignment_id}/reset")
def reset_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Reset an assignment - delete responses and results, reset status"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Delete the assignment (cascade handles: Response, Result, ExitLog)
    db.delete(assignment)
    db.commit()
    
    # Recreate the assignment with pending status
    new_assignment = Assignment(
        user_id=assignment.user_id,
        test_id=assignment.test_id,
        status="pending",
        pretest_completed=False
    )
    db.add(new_assignment)
    db.commit()
    
    return {"message": "Assignment reset successfully"}


@router.post("/assignments/assign-all/{user_id}")
def assign_all_tests(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Assign all tests to a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    all_tests = db.query(Test).all()
    assigned_test_ids = {a.test_id for a in db.query(Assignment).filter(Assignment.user_id == user_id).all()}

    created = []
    for test in all_tests:
        if test.id not in assigned_test_ids:
            new_assignment = Assignment(user_id=user_id, test_id=test.id)
            db.add(new_assignment)
            created.append(test.name)

    db.commit()
    return {
        "message": f"Assigned {len(created)} tests",
        "assigned_tests": created
    }


@router.post("/assignments/{assignment_id}/exit-log")
def log_exit(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log an exit event during test"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    log = ExitLog(user_id=current_user.id, assignment_id=assignment_id)
    db.add(log)
    db.commit()
    return {"message": "Exit logged"}


@router.post("/assignments/{assignment_id}/complete-tutorial")
def complete_tutorial(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark tutorial as completed for an assignment"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.pretest_completed = True
    db.commit()
    return {"message": "Tutorial marked as completed"}
