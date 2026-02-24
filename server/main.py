# server/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from auth import get_current_user, require_admin, hash_password
from models import User, Test, Assignment
from models import Response, Result, Question, Option
from datetime import datetime
from schemas import TestSubmission


from database import engine, Base, SessionLocal, get_db # Add get_db
from models import User
from auth import verify_password, create_access_token
from schemas import Token
from schemas import UserCreate

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS settings
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

@app.get("/")
def read_root():
    return {"message": "Hello from Python Backend!"}

# --- NEW LOGIN ROUTE ---
@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Find user by username
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # 2. Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # 3. Verify password
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # 4. Create Token
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
def create_user(user: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
        role=user.role,
        # ADD NEW FIELDS
        full_name=user.full_name,
        age=user.age,
        education=user.education,
        department=user.department,
        position=user.position
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "username": new_user.username}

# server/main.py (Add this route)
@app.get("/users/")
def get_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).all()
    # Return all the new fields
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

# 1. Assign a Test to a User
@app.post("/assignments/", status_code=201)
def create_assignment(user_id: int, test_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if test exists
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Check if already assigned
    existing = db.query(Assignment).filter(Assignment.user_id == user_id, Assignment.test_id == test_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Test already assigned to this user")
    
    new_assignment = Assignment(user_id=user_id, test_id=test_id)
    db.add(new_assignment)
    db.commit()
    
    return {"message": "Test assigned successfully"}

# 2. Get All Assignments (Admin View)
@app.get("/assignments/")
def get_assignments(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    assignments = db.query(Assignment).all()
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

# 3. Get Assignments for the CURRENT user (Participant View)
@app.get("/users/me/assignments")
def get_my_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id).all()
    
    result = []
    for a in assignments:
        result.append({
            "id": a.id,
            "test_id": a.test_id,
            "test_name": a.test.name,
            "status": a.status,
            "assigned_at": a.assigned_at
        })
    return result

# 1. START TEST: Get Questions for an Assignment
@app.get("/assignments/{assignment_id}/start")
def start_test(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Find the assignment
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update status to in_progress
    if assignment.status == "pending":
        assignment.status = "in_progress"
        db.commit()

    # Get questions and options
    questions = db.query(Question).filter(Question.test_id == assignment.test_id).order_by(Question.order_index).all()
    
    # Format for frontend
    output = []
    for q in questions:
        options_data = []
        for opt in q.options:
            options_data.append({
                "id": opt.id,
                "label": opt.label,
                "content": opt.content
                # We hide scoring_logic from the user!
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
        "questions": output,
        "settings": assignment.test.settings
    }

# 2. SUBMIT TEST: Save Answers & Calculate Score
@app.post("/assignments/{assignment_id}/submit")
def submit_test(assignment_id: int, submission: TestSubmission, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # answers format: { "question_id": "selected_option_id", ... }
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment or assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    score = 0
    
    # Save each response
    for q_id, opt_id in submission.answers.items():
        # Save Response
        new_resp = Response(
            user_id=current_user.id,
            test_id=assignment.test_id,
            question_id=int(q_id),
            selected_option_id=int(opt_id)
        )
        db.add(new_resp)
        
        # Calculate Score (Simple Logic for Speed Test)
        # Check if the selected option is correct
        option = db.query(Option).filter(Option.id == int(opt_id)).first()
        if option and option.scoring_logic.get("correct") == True:
            score += 1

    # Save Result
    new_result = Result(
        user_id=current_user.id,
        test_id=assignment.test_id,
        score=score,
        time_taken=submission.time_taken
    )
    db.add(new_result)
    
    # Update Assignment Status
    assignment.status = "completed"
    db.commit()
    
    return {"message": "Test submitted successfully", "score": score}

@app.get("/tests/")
def get_tests(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(Test).all()