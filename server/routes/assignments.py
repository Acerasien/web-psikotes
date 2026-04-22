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
from models import User, Test, Assignment, Result, Question, Option, ExitLog, Response, ClassConfig
from schemas import TestSubmission

# Import scoring functions
from scoring.disc import score_disc
from scoring.speed import score_speed
from scoring.temperament import score_temperament
from scoring.memory import score_memory
from scoring.logic import score_logic
from scoring.papi_kostick import score_papi_kostick
from scoring.cbi import score_cbi_test

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
        exit_count = db.query(ExitLog).filter(ExitLog.assignment_id == a.id).count()
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "username": a.user.username,
            "full_name": a.user.full_name,
            "test_id": a.test_id,
            "test_name": a.test.name,
            "test_code": a.test.code,
            "status": a.status,
            "assigned_at": a.assigned_at.isoformat() + "Z" if a.assigned_at else None,
            "started_at": a.started_at.isoformat() + "Z" if a.started_at else None,
            "exit_count": exit_count,
            "pretest_completed": a.pretest_completed
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
    
    # Load class config once if the user has one
    time_overrides = {}
    if current_user.class_id:
        class_config = db.query(ClassConfig).filter(ClassConfig.id == current_user.class_id).first()
        if class_config:
            time_overrides = class_config.config.get("time_overrides", {})

    result = []
    for a in assignments:
        time_limit = a.test.time_limit
        if a.test.code in time_overrides:
            override = time_overrides[a.test.code]
            if isinstance(override, dict):
                # Handle special complex overrides (MEM and IQ)
                if "encoding" in override and "recall" in override:
                    time_limit = override["encoding"] + override["recall"]
                elif "phases" in override and isinstance(override["phases"], list):
                    time_limit = sum(override["phases"])
                else:
                    # Fallback to test default or 0 if dict structure unknown
                    time_limit = a.test.time_limit
            else:
                time_limit = override
            
        # Ensure time_limit is a number before division
        time_in_minutes = (time_limit // 60) if isinstance(time_limit, (int, float)) and time_limit > 0 else 0
        
        result.append({
            "id": a.id,
            "test_id": a.test_id,
            "test_name": a.test.name,
            "test_code": a.test.code,
            "status": a.status,
            "pretest_completed": a.pretest_completed,
            "assigned_at": a.assigned_at,
            "duration": time_in_minutes
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
    if assignment.status == "completed":
        raise HTTPException(status_code=403, detail="This test has already been completed and cannot be retaken.")
    if assignment.status == "pending":
        assignment.status = "in_progress"
        assignment.started_at = datetime.utcnow()
        db.commit()

    # Determine time limit: check user's class override first, then fall back to test default
    time_limit = assignment.test.time_limit
    if current_user.class_id:
        class_config = db.query(ClassConfig).filter(ClassConfig.id == current_user.class_id).first()
        if class_config:
            time_overrides = class_config.config.get("time_overrides", {})
            if assignment.test.code in time_overrides:
                override = time_overrides[assignment.test.code]
                if isinstance(override, dict):
                    # For MEM/IQ, we use the specific sub-times in the component, 
                    # but for the main timer we need a scalar.
                    if "encoding" in override and "recall" in override:
                        time_limit = override["encoding"] + override["recall"]
                    elif "phases" in override and isinstance(override["phases"], list):
                        time_limit = sum(override["phases"])
                    else:
                        time_limit = override # Might still be a dict if unknown
                else:
                    time_limit = override

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
        q_settings = q.meta_data  # Store in variable
        output.append({
            "id": q.id,
            "content": q.content,
            "order": q.order_index,
            "options": options_data,
            "settings": q_settings
        })
    test_settings = assignment.test.settings or {}
    # Apply special overrides for Memory Test (MEM) if defined in class config
    if assignment.test.code == "MEM" and current_user.class_config:
        time_overrides = current_user.class_config.config.get("time_overrides", {})
        mem_overrides = time_overrides.get("MEM", {})
        if isinstance(mem_overrides, dict):
            if "encoding" in mem_overrides:
                test_settings["encoding_time"] = mem_overrides["encoding"]
            if "recall" in mem_overrides:
                test_settings["recall_time"] = mem_overrides["recall"]

    return {
        "test_name": assignment.test.name,
        "test_code": assignment.test.code,
        "time_limit": time_limit,
        "settings": test_settings,
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
        option_id = ans.get("option_id")
        # Handle multi-select (comma-separated option IDs)
        if option_id and "," in str(option_id):
            # Multi-select question - create multiple response records
            option_ids = [int(x.strip()) for x in str(option_id).split(",")]
            for opt_id in option_ids:
                resp = Response(
                    user_id=current_user.id,
                    test_id=assignment.test_id,
                    assignment_id=assignment.id,
                    question_id=ans["question_id"],
                    selected_option_id=opt_id,
                    selection_type="multi",  # Mark as multi-select
                )
                db.add(resp)
        else:
            # Single select - normal behavior
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
    answered_count = 0
    total_questions = 0

    if test_code == "DISC":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        details = score_disc(submission.answers, questions)
        score = len({ans["question_id"] for ans in submission.answers})
        answered_count = score  # For DISC, each question answered = 1

    elif test_code == "SPEED":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        details = score_speed(submission.answers, questions)
        score = details["score"]
        answered_count = details.get("total_answered", len(submission.answers))

    elif test_code == "TEMP":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        details = score_temperament(submission.answers, questions)
        score = sum(details["raw_scores"].values()) if details["raw_scores"] else 0
        answered_count = len({ans["question_id"] for ans in submission.answers})

    elif test_code == "MEM":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        details = score_memory(submission.answers, questions)
        score = details["score"]
        answered_count = len(submission.answers)

    elif test_code == "LOGIC":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        details = score_logic(submission.answers, questions)
        score = details["score"]
        answered_count = len(submission.answers)

    elif test_code == "LEAD":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        details = score_papi_kostick(submission.answers, questions)
        # Score = total number of answers (PAPI is personality, no "correct")
        score = len(submission.answers)
        answered_count = len(submission.answers)

    elif test_code == "CBI":
        questions = (
            db.query(Question)
            .options(joinedload(Question.options))
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        details = score_cbi_test(submission.answers, questions)
        # Score = overall concern score
        score = details["score"]
        answered_count = len(submission.answers)

    else:
        # Default: simple correct count
        questions = (
            db.query(Question)
            .filter(Question.test_id == assignment.test_id)
            .all()
        )
        total_questions = len(questions)
        for ans in submission.answers:
            if ans.get("type", "single") == "single":
                option = db.query(Option).filter(Option.id == ans["option_id"]).first()
                if option and option.scoring_logic.get("correct"):
                    score += 1
        answered_count = len(submission.answers)

    # Calculate completion status
    is_complete = answered_count >= total_questions

    # Add completion info to details
    if details is None:
        details = {}
    
    # Add session metadata
    details["session"] = {
        "device": submission.device_info,
        "started_at": assignment.started_at.isoformat() if assignment.started_at else None,
        "completed_at": datetime.utcnow().isoformat()
    }
    details["answered_count"] = answered_count
    details["total_questions"] = total_questions
    details["is_complete"] = is_complete

    # 4. Create Result record with additional race condition check
    # Re-check assignment status to prevent race condition duplicate submissions
    assignment = db.query(Assignment).with_for_update().filter(Assignment.id == assignment_id).first()
    if not assignment:
        db.rollback()
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.status != "in_progress":
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Test has already been submitted or is no longer in progress."
        )
    
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
