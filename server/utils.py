"""
Utility functions used across the application
"""
from typing import Optional


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
        "LOGIC": 100,  # 50 questions × 2 points each
    }.get(test_code, 100)
