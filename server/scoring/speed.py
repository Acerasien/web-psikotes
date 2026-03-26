# server/scoring/speed.py
def score_speed(answers, questions):
    """
    answers: list of dicts with keys: question_id, option_id, type (should be 'single' for speed)
    questions: list of Question objects with options (each option has scoring_logic with "correct": bool)

    Returns a dict with:
        - score: number correct (out of total questions, skipped = wrong)
        - total_questions: total number of questions in the test
        - accuracy: percentage correct (out of total questions)
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

    # Build a lookup for submitted answers
    submitted_answers = {}
    for ans in answers:
        if ans["type"] == "single":  # speed uses 'single'
            submitted_answers[ans["question_id"]] = ans["option_id"]

    # Count correct answers across ALL questions (skipped = wrong)
    correct = 0
    total_questions = len(questions)
    total_answered = len(submitted_answers)

    for q in questions:
        user_answer = submitted_answers.get(q.id)
        if user_answer is not None:
            # User answered this question
            correct_answer = correct_option_ids.get(q.id)
            if user_answer == correct_answer:
                correct += 1
        # else: skipped = wrong (no points added)

    accuracy = (correct / total_questions * 100) if total_questions > 0 else 0

    # Determine flag (based on answered count vs accuracy)
    total_answered = len(submitted_answers)
    flag = None
    if total_answered > 50 and accuracy < 50:
        flag = "Likely Random Guessing"

    # Determine band (based on score out of 100)
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
        "total_questions": total_questions,
        "total_answered": total_answered,
        "accuracy": round(accuracy, 2),
        "flag": flag,
        "band": band
    }