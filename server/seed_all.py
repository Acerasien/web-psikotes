# server/seed_all.py
import subprocess
import sys

scripts = [
    "seed.py",
    "seed_disc.py",
    "seed_speed_test.py",
    "seed_temperament.py",
    "seed_memory.py",
    "seed_logic.py",
    "seed_leadership.py",
]

for script in scripts:
    print(f"\n--- Running {script} ---")
    result = subprocess.run([sys.executable, script])
    if result.returncode != 0:
        print(f"Error in {script}. Stopping.")
        break