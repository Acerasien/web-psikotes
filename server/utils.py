from datetime import datetime, timedelta, timezone
from typing import Optional


def get_now_jakarta() -> datetime:
    """
    Get the current time in Jakarta (WIB, UTC+7).
    Returns a naive datetime object (no timezone info) to remain compatible 
    with existing naive DateTime columns in the database.
    """
    return datetime.now(timezone(timedelta(hours=7))).replace(tzinfo=None)


def get_max_score(test_code: str) -> Optional[int]:
    """
    Get the maximum possible score for a given test code.
    Returns None for tests that don't have a single max score (e.g., TEMP, LEAD).
    """
    return {
        "DISC": 24,
        "SPEED": 100,
        "TEMP": 168,
        "MEM": 100,
        "LOGIC": 100,
        "IQ": 100,
        "CBI": 140,
    }.get(test_code, None)
