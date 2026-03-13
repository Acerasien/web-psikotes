"""
User management routes - CRUD operations for users
"""
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from auth import hash_password, verify_password, require_admin, require_superadmin, get_current_user
from database import get_db
from models import User, ExitLog, Result, Assignment
from schemas import UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[dict])
def get_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all users (admin and superadmin only)"""
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


@router.post("/", status_code=201)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user"""
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


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    """Get single user by ID (superadmin only)"""
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


@router.put("/{user_id}")
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user information"""
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

    # Update fields
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


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    """Delete user - cascade delete handles related data (superadmin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Cascade delete handles: ExitLog, Response, Result, Assignment
    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.post("/admin/reset-password/{user_id}")
def reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin)
):
    """Reset user password to a random 10-character string (superadmin only)"""
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
