# server/scoring/speed.py
def score_speed(answers, questions):
    """
    answers: list of dicts with keys: question_id, option_id, type (should be 'single' for speed)
    questions: list of Question objects with options (each option has scoring_logic with "correct": bool)
    
    Returns a dict with:
        - score: number correct
        - total_questions: number of questions answered (should be 100)
        - accuracy: percentage correct
        - flag: "Likely Random Guessing" if attempts > 50 and accuracy < 50, else None
        - band: performance band (Excellent, Good, Average, Needs Improvement)
    """
    # Build a lookup for correct answers
    correct_option_ids = {}
    for q in questions:
        for opt in q.options:
            if opt.scoring_logic.get("correct") is True:
                correct_option_ids[q.id] = opt.id
                break  # assume only one correct per question
    
    # Count correct answers
    correct = 0
    total_answered = 0
    for ans in answers:
        if ans["type"] == "single":  # speed uses 'single'
            total_answered += 1
            if ans["option_id"] == correct_option_ids.get(ans["question_id"]):
                correct += 1
    
    accuracy = (correct / total_answered * 100) if total_answered > 0 else 0
    
    # Determine flag
    flag = None
    if total_answered > 50 and accuracy < 50:
        flag = "Likely Random Guessing"
    
    # Determine band (based on total correct, assuming 100 questions)
    # But careful: total_answered may be less than 100 if they didn't finish.
    # Spec says "If a participant attempts >50 questions but accuracy falls below 50%"
    # We'll use the accuracy and total_attempted for flag, but band should be based on score out of 100?
    # The spec says performance bands based on score (0-100). But if they didn't finish, score is out of answered.
    # Let's follow spec: max score 100, so we'll use correct count directly (since each correct = 1 point).
    # So if they answered 80 and got 60 correct, score = 60.
    score = correct
    
    if score >= 80:
        band = "Excellent Processing Speed"
    elif score >= 60:
        band = "Good"
    elif score >= 40:
        band = "Average"
    else:
        band = "Needs Improvement"
    
    return {
        "score": score,
        "total_answered": total_answered,
        "accuracy": round(accuracy, 2),
        "flag": flag,
        "band": band
    }