from datetime import datetime, timedelta, timezone

def get_now_jakarta():
    # Simulate the function logic
    return datetime.now(timezone(timedelta(hours=7))).replace(tzinfo=None)

system_now = datetime.now()
jakarta_now = get_now_jakarta()

print(f"System Now:  {system_now}")
print(f"Jakarta Now: {jakarta_now}")

# Calculate the difference
diff = jakarta_now - system_now
print(f"Difference:  {diff}")

# If system is in UTC, diff should be around 7 hours
# If system is in Jakarta, diff should be around 0
