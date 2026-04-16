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
        "LOGIC": 100,
        "IQ": 100,
        "CBI": 140,
    }.get(test_code, None)
