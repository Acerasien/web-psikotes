"""
Test definition routes - Get available tests
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_admin, get_current_user
from database import get_db
from models import User, Test

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/")
def get_tests(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all available tests (admin and superadmin only)"""
    return db.query(Test).all()
