# server/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from auth import get_current_user, require_admin, hash_password

from database import engine, Base, SessionLocal
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

# Helper to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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