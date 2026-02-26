# server/scoring/memory.py
def score_memory(answers, questions):
    """
    answers: list of dicts with question_id, option_id, type='single'
    questions: list of Question objects with options (each option has scoring_logic with "correct": bool)

    Returns dict with:
        - score: total points (2 per correct)
        - total_questions: number of questions answered
        - accuracy: percentage
        - band: performance band (Excellent, Good, Average, Needs Improvement)
    """
    correct_count = 0
    total_answered = 0

    # Build lookup for correct option per question
    correct_option = {}
    for q in questions:
        for opt in q.options:
            if opt.scoring_logic.get("correct"):
                correct_option[q.id] = opt.id
                break

    for ans in answers:
        if ans.get("type") == "single":
            total_answered += 1
            if ans["option_id"] == correct_option.get(ans["question_id"]):
                correct_count += 1

    score = correct_count * 2  # 2 points each
    accuracy = (correct_count / total_answered * 100) if total_answered > 0 else 0

    if score >= 80:
        band = "Excellent Memory"
    elif score >= 60:
        band = "Good"
    elif score >= 40:
        band = "Average"
    else:
        band = "Needs Improvement"

    return {
        "score": score,
        "correct_count": correct_count,
        "total_answered": total_answered,
        "accuracy": round(accuracy, 2),
        "band": band
    }