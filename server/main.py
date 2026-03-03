# server/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from auth import get_current_user, require_admin, require_superadmin, hash_password
from models import User, Test, Assignment, Response, Result, Question, Option, ExitLog
from datetime import datetime
from datetime import date
from schemas import TestSubmission
from database import engine, Base, SessionLocal, get_db
from auth import verify_password, create_access_token
from schemas import Token
from schemas import UserCreate
from typing import Optional  # <-- ADDED for optional query parameters
from scoring.disc import score_disc
from scoring.speed import score_speed
from scoring.temperament import score_temperament
from sqlalchemy.orm import joinedload  # to load options efficiently
from schemas import UserUpdate
from scoring.memory import score_memory
import secrets
import string
from scoring.logic import score_logic
from sqlalchemy import func, desc

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS settings (unchanged)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper for max score per test (optional, used in charts)
def get_max_score(test_code):
    return {
        "DISC": 24,
        "SPEED": 100,
        "TEMP": 168,
        "MEM": 100,
        "LOGIC": 100,
    }.get(test_code, 100)

@app.get("/")
def read_root():
    return {"message": "Hello from Python Backend!"}

# --- LOGIN ROUTE (unchanged) ---
@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "id": current_user.id
    }

@app.post("/users/", status_code=201)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # both superadmin and admin allowed
):
    # If current user is not superadmin, they cannot create admin/superadmin
    if current_user.role != "superadmin" and user.role in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail="Only superadmin can create admin users"
        )
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
        role=user.role,
        full_name=user.full_name,
        gender=user.gender,
        age=user.age,
        education=user.education,
        department=user.department,
        position=user.position
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "username": new_user.username}

@app.get("/users/")
def get_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).all()
    return [
        {
            "id": u.id, 
            "username": u.username, 
            "role": u.role,
            "full_name": u.full_name,
            "department": u.department,
            "position": u.position
        } 
        for u in users
    ]
    
@app.post("/admin/reset-password/{user_id}")
def reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate a random 10-character password
    alphabet = string.ascii_letters + string.digits
    new_password = ''.join(secrets.choice(alphabet) for _ in range(10))

    # Hash and update
    user.password_hash = hash_password(new_password)
    db.commit()

    return {"new_password": new_password}

# ---------- ADDED: Get single user by ID ----------
@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), superadmin: User = Depends(require_superadmin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "gender": user.gender,
        "age": user.age,
        "education": user.education,
        "department": user.department,
        "position": user.position
    }

@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If current user is not superadmin, they cannot change roles
    if current_user.role != "superadmin" and user_update.role is not None:
        raise HTTPException(
            status_code=403,
            detail="Only superadmin can change user roles"
        )

    # Also prevent a non-superadmin from elevating someone to admin/superadmin
    if current_user.role != "superadmin" and user_update.role in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail="Only superadmin can assign admin or superadmin roles"
        )

    # Update fields (same as before)
    if user_update.username is not None:
        if user_update.username != user.username:
            existing = db.query(User).filter(User.username == user_update.username).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")
        user.username = user_update.username
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.gender is not None:
        user.gender = user_update.gender
    if user_update.age is not None:
        user.age = user_update.age
    if user_update.education is not None:
        user.education = user_update.education
    if user_update.department is not None:
        user.department = user_update.department
    if user_update.position is not None:
        user.position = user_update.position
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.password is not None and user_update.password != "":
        user.password_hash = hash_password(user_update.password)

    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user": user}

@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete related records (cascade manually)
    db.query(ExitLog).filter(ExitLog.user_id == user_id).delete()
    db.query(Response).filter(Response.user_id == user_id).delete()
    db.query(Result).filter(Result.user_id == user_id).delete()
    db.query(Assignment).filter(Assignment.user_id == user_id).delete()
    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}

# ---------- MODIFIED: Assignments endpoint with optional user_id filter ----------
@app.get("/assignments/")
def get_assignments(
    user_id: Optional[int] = None,  # <-- ADDED query parameter
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
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

@app.post("/assignments/", status_code=201)
def create_assignment(user_id: int, test_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
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

@app.get("/users/me/assignments")
def get_my_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

@app.get("/assignments/{assignment_id}/start")
def start_test(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

@app.post("/assignments/{assignment_id}/submit")
def submit_test(
    assignment_id: int,
    submission: TestSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Find the assignment
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if assignment.status != "in_progress":
        raise HTTPException(status_code=400, detail="Test is not in progress")

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
        score = len({ans["question_id"] for ans in submission.answers})  # 24

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
        # Optional: you could set score to something meaningful, e.g., sum of raw scores
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

    else:
        # Default: IQ, Memory, Logic, etc. (simple correct count)
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

# ---------- MODIFIED: Results endpoint with optional user_id filter and user_id in response ----------
@app.get("/results/")
def get_results(
    user_id: Optional[int] = None,
    test_id: Optional[int] = None,           # new
    search: Optional[str] = None,            # new
    from_date: Optional[date] = None,        # new
    to_date: Optional[date] = None,          # new
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    query = db.query(Result).join(User).join(Test)  # need joins for filtering on related fields

    if user_id is not None:
        query = query.filter(Result.user_id == user_id)
    if test_id is not None:
        query = query.filter(Result.test_id == test_id)
    if from_date is not None:
        query = query.filter(Result.completed_at >= from_date)
    if to_date is not None:
        query = query.filter(Result.completed_at <= to_date)
    if search:
        # search in user.full_name and user.username
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%"))
        )

    results = query.all()
    output = []
    for r in results:
        total_questions = db.query(Question).filter(Question.test_id == r.test_id).count()
        # Determine max possible score based on test code
        if r.test.code == "DISC":
            max_score = 24
        elif r.test.code == "SPEED":
            max_score = 100
        elif r.test.code == "TEMP":
            max_score = 168  # Not used in generic display
        elif r.test.code == "MEM":
            max_score = 100
        elif r.test.code == "LOGIC":
            max_score = 100
        else:
            max_score = total_questions  # fallback for IQ, Leadership, etc.

        output.append({
            "id": r.id,
            "user_id": r.user_id,
            "username": r.user.username,
            "full_name": r.user.full_name,
            "test_name": r.test.name,
            "test_id": r.test_id,
            "score": r.score,
            "total_questions": total_questions,
            "max_score": max_score,          # <-- new field
            "time_taken": r.time_taken,
            "completed_at": r.completed_at,
            "details": r.details
        })
    return output

@app.post("/assignments/{assignment_id}/lock")
def lock_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.status = "locked"
    db.commit()
    return {"message": "Assignment locked due to integrity violation"}

@app.post("/admin/assignments/{assignment_id}/unlock")
def unlock_assignment(assignment_id: int, db: Session = Depends(get_db), superadmin: User = Depends(require_superadmin)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.status = "in_progress"
    db.commit()
    return {"message": "Assignment unlocked"}

@app.get("/tests/")
def get_tests(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(Test).all()

@app.post("/assignments/{assignment_id}/exit-log")
def log_exit(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    log = ExitLog(user_id=current_user.id, assignment_id=assignment_id)
    db.add(log)
    db.commit()
    return {"message": "Exit logged"}

@app.get("/admin/locked-assignments")
def get_locked_assignments(db: Session = Depends(get_db), superadmin: User = Depends(require_superadmin)):
    assignments = db.query(Assignment).filter(Assignment.status == "locked").all()
    result = []
    for a in assignments:
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "username": a.user.username,
            "full_name": a.user.full_name,
            "test_name": a.test.name,
            "status": a.status,
            "assigned_at": a.assigned_at,
        })
    return result

@app.get("/admin/exit-logs")
def get_exit_logs(
    user_id: Optional[int] = None,
    assignment_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    query = db.query(ExitLog).join(User).join(Assignment)
    if user_id:
        query = query.filter(ExitLog.user_id == user_id)
    if assignment_id:
        query = query.filter(ExitLog.assignment_id == assignment_id)
    if from_date:
        query = query.filter(ExitLog.timestamp >= from_date)
    if to_date:
        query = query.filter(ExitLog.timestamp <= to_date)
    logs = query.order_by(ExitLog.timestamp.desc()).all()
    output = []
    for log in logs:
        output.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username,
            "full_name": log.user.full_name,
            "assignment_id": log.assignment_id,
            "test_name": log.assignment.test.name,
            "timestamp": log.timestamp
        })
    return output

@app.post("/admin/assignments/{assignment_id}/reset")
def reset_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)          # both admin and superadmin can reset
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Delete all responses for this assignment
    db.query(Response).filter(Response.assignment_id == assignment_id).delete()
    # Delete the result for this assignment (if any)
    db.query(Result).filter(Result.assignment_id == assignment_id).delete()

    # Reset assignment status
    assignment.status = "pending"
    # Optionally reset the pretest flag so they see tutorial again
    assignment.pretest_completed = False

    db.commit()
    return {"message": "Assignment reset successfully"}

@app.post("/assignments/assign-all/{user_id}")
def assign_all_tests(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)   # both admin and superadmin allowed
):
    # Check user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all tests
    all_tests = db.query(Test).all()
    # Get already assigned test IDs for this user
    assigned_test_ids = {a.test_id for a in db.query(Assignment).filter(Assignment.user_id == user_id).all()}

    # Create assignments for missing tests
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
    
@app.get("/admin/stats/summary")
def get_stats_summary(db: Session = Depends(get_db), superadmin: User = Depends(require_superadmin)):
    total_participants = db.query(User).filter(User.role == "participant").count()
    total_assignments = db.query(Assignment).count()
    completed_assignments = db.query(Assignment).filter(Assignment.status == "completed").count()
    completion_rate = (completed_assignments / total_assignments * 100) if total_assignments else 0
    avg_score = db.query(func.avg(Result.score)).scalar() or 0

    return {
        "total_participants": total_participants,
        "total_assignments": total_assignments,
        "completed_assignments": completed_assignments,
        "completion_rate": round(completion_rate, 2),
        "average_score": round(avg_score, 2)
    }

@app.get("/admin/stats/tests")
def get_test_stats(db: Session = Depends(get_db), superadmin: User = Depends(require_superadmin)):
    tests = db.query(Test).all()
    result = []
    for test in tests:
        completed_count = db.query(Assignment).filter(Assignment.test_id == test.id, Assignment.status == "completed").count()
        avg_score = db.query(func.avg(Result.score)).filter(Result.test_id == test.id).scalar() or 0
        result.append({
            "test_id": test.id,
            "test_name": test.name,
            "completed_count": completed_count,
            "avg_score": round(avg_score, 2),
            "max_score": get_max_score(test.code)
        })
    return result

@app.get("/admin/stats/recent")
def get_recent_activity(limit: int = 10, db: Session = Depends(get_db), superadmin: User = Depends(require_superadmin)):
    recent_results = db.query(Result).order_by(desc(Result.completed_at)).limit(limit).all()
    output = []
    for r in recent_results:
        total_questions = db.query(Question).filter(Question.test_id == r.test_id).count()
        output.append({
            "id": r.id,
            "participant_name": r.user.full_name or r.user.username,
            "test_name": r.test.name,
            "score": r.score,
            "total_questions": total_questions,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None
        })
    return output

@app.post("/assignments/{assignment_id}/complete-tutorial")
def complete_tutorial(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.pretest_completed = True
    db.commit()
    return {"message": "Tutorial marked as completed"}