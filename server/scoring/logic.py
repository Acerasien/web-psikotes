# server/scoring/logic.py
def score_logic(answers, questions):
    """
    answers: list of dicts with question_id, option_id, type='single'
    questions: list of Question objects with options (each option has scoring_logic with "correct": bool)

    Returns dict with:
        - score: total points (4 per correct)
        - correct_count: number correct
        - total_questions: total questions answered (should be 25)
        - percentage: (score / 100) * 100
        - band: performance band (Excellent Reasoning, Good, Average, Needs Improvement)
    """
    # Build lookup for correct option per question
    correct_option = {}
    for q in questions:
        for opt in q.options:
            if opt.scoring_logic.get("correct"):
                correct_option[q.id] = opt.id
                break

    correct = 0
    total_answered = 0
    for ans in answers:
        if ans.get("type") == "single":
            total_answered += 1
            if ans["option_id"] == correct_option.get(ans["question_id"]):
                correct += 1

    score = correct * 4
    percentage = (score / 100) * 100 if total_answered == 25 else (correct / 25) * 100  # rough

    if score >= 85:
        band = "Excellent Reasoning"
    elif score >= 70:
        band = "Good"
    elif score >= 50:
        band = "Average"
    else:
        band = "Needs Improvement"

    return {
        "score": score,
        "correct_count": correct,
        "total_answered": total_answered,
        "percentage": round(percentage, 2),
        "band": band
    }