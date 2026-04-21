# server/scratch/test_wpt_scoring.py
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scoring.logic import get_wpt_interpretation

test_cases = [0, 4, 5, 10, 11, 22, 26, 30, 31, 41, 50]

print(f"{'Score':<6} | {'IQ':<10} | {'Percentile':<12} | {'Classification'}")
print("-" * 60)
for s in test_cases:
    interp = get_wpt_interpretation(s)
    print(f"{s:<6} | {interp['iq']:<10} | {interp['percentile']:<12} | {interp['classification']}")
