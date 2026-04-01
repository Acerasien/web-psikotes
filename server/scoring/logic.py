# server/scoring/logic.py
def score_logic(answers, questions):
    """
    answers: list of dicts with question_id, option_id, type ('single' or 'multi')
    questions: list of Question objects with options (each option has scoring_logic with "correct": bool)

    Returns dict with:
        - score: total points (4 per correct)
        - correct_count: number correct
        - total_questions: total questions answered (should be 50)
        - percentage: (correct / 50) * 100
        - band: performance band (Excellent Reasoning, Good, Average, Needs Improvement)
    """
    # Build lookup for correct option(s) per question
    correct_options = {}  # {question_id: [option_id1, option_id2]}
    multi_select_questions = {}  # {question_id: True}
    
    for q in questions:
        is_multi_select = q.meta_data.get("multi_select", False) if q.meta_data else False
        correct_ids = []
        for opt in q.options:
            if opt.scoring_logic.get("correct"):
                correct_ids.append(opt.id)
        if correct_ids:
            correct_options[q.id] = correct_ids
            if is_multi_select:
                multi_select_questions[q.id] = True

    correct = 0
    
    # Group answers by question
    answers_by_question = {}
    for ans in answers:
        q_id = ans.get("question_id")
        if q_id not in answers_by_question:
            answers_by_question[q_id] = []
        answers_by_question[q_id].append(ans)
    
    for q_id, q_answers in answers_by_question.items():
        is_multi = multi_select_questions.get(q_id, False)
        
        if is_multi:
            # Multi-select: collect all selected option IDs
            selected_option_ids = set()
            for ans in q_answers:
                option_id = ans.get("option_id")
                if option_id:
                    # Handle comma-separated string from frontend
                    option_id_str = str(option_id)
                    if "," in option_id_str:
                        # Split and add each ID
                        for id_part in option_id_str.split(","):
                            selected_option_ids.add(int(id_part.strip()))
                    else:
                        selected_option_ids.add(int(option_id))
            
            # Check if ALL correct options are selected (and only correct options)
            correct_ids = set(correct_options.get(q_id, []))
            if selected_option_ids == correct_ids:
                correct += 1
        else:
            # Single select: normal comparison
            for ans in q_answers:
                if ans.get("option_id") == correct_options.get(q_id, [None])[0]:
                    correct += 1
                    break

    score = correct * 2  # 2 points per question, max = 100
    total_questions = 50
    percentage = (correct / total_questions) * 100

    # Bands based on percentage (0-100%)
    # 85%+ = Excellent (85+ points)
    # 70%+ = Good (70+ points)
    # 50%+ = Average (50+ points)
    if percentage >= 85:
        band = "Excellent Reasoning"
    elif percentage >= 70:
        band = "Good"
    elif percentage >= 50:
        band = "Average"
    else:
        band = "Needs Improvement"

    return {
        "score": score,
        "correct_count": correct,
        "total_answered": len(answers_by_question),
        "percentage": round(percentage, 2),
        "band": band
    }