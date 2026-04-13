# server/scoring/iq.py

SCORE_TO_IQ = {
    0: 40,  1: 40,  2: 43,  3: 45,  4: 47,  5: 48,  6: 52,  7: 55,
    8: 57,  9: 60,  10: 63, 11: 67, 12: 70, 13: 72, 14: 75, 15: 78,
    16: 81, 17: 85, 18: 88, 19: 91, 20: 94, 21: 96, 22: 100, 23: 103,
    24: 106, 25: 109, 26: 113, 27: 116, 28: 119, 29: 121, 30: 124,
    31: 128, 32: 131, 33: 133, 34: 137, 35: 140, 36: 142, 37: 145,
    38: 149, 39: 152, 40: 155, 41: 157, 42: 161, 43: 165, 44: 167,
    45: 169, 46: 173, 47: 176, 48: 179, 49: 183, 50: 183,
}


def classify_iq(iq):
    if iq < 52:
        return "Moderate Intellectual Disability"
    if iq < 68:
        return "Mild Intellectual Disability"
    if iq < 80:
        return "Borderline Intellectual Functioning"
    if iq < 90:
        return "Low Average"
    if iq < 110:
        return "Average"
    if iq < 120:
        return "High Average"
    if iq < 140:
        return "Superior"
    if iq < 170:
        return "Very Superior"
    return "Genius"


def score_iq(answers, questions):
    """
    Score IQ test: count correct → scale (correct/2) → IQ lookup → classification.

    Args:
        answers: list of {question_id, option_id(s)}
        questions: list of Question objects with options (scoring_logic: {"correct": bool})

    Returns:
        {
            "raw_score": int,          # correct count (0-100)
            "max_score": 100,
            "scaled_score": int,       # correct / 2, rounded (0-50)
            "iq": int,
            "classification": str,
            "section_scores": {
                "section_1": {"correct": int, "max": 50},  # Phase 1-4
                "section_2": {"correct": int, "max": 50},  # Phase 5-8
            },
            "phase_scores": {phase_order: {"answered": int, "correct": int}},
        }
    """
    # Build lookup: question_id -> {correct_option_ids, is_multi_select, phase_order}
    question_map = {}
    for q in questions:
        is_multi = q.meta_data.get("multi_select", False) if q.meta_data else False
        correct_ids = [opt.id for opt in q.options if opt.scoring_logic.get("correct")]
        phase_order = q.phase.order_number if q.phase else 0
        question_map[q.id] = {
            "correct_ids": correct_ids,
            "is_multi": is_multi,
            "phase_order": phase_order,
        }

    # Score each answer
    correct = 0
    section_1_correct = 0  # Phase 1-4
    section_2_correct = 0  # Phase 5-8
    phase_scores = {}  # {phase_order: {"answered": int, "correct": int}}

    for ans in answers:
        q_id = ans["question_id"]
        if q_id not in question_map:
            continue

        q_info = question_map[q_id]
        phase_order = q_info["phase_order"]

        # Track phase stats
        if phase_order not in phase_scores:
            phase_scores[phase_order] = {"answered": 0, "correct": 0}
        phase_scores[phase_order]["answered"] += 1

        # Check correctness
        is_correct = False
        if q_info["is_multi"]:
            # Multi-select: must select exactly both correct options
            selected = set(ans.get("option_ids", []))
            expected = set(q_info["correct_ids"])
            is_correct = selected == expected
        else:
            # Single-answer: exact match
            selected = ans.get("option_id")
            is_correct = selected in q_info["correct_ids"]

        if is_correct:
            correct += 1
            phase_scores[phase_order]["correct"] += 1

            # Section tracking
            if phase_order <= 4:
                section_1_correct += 1
            else:
                section_2_correct += 1

    # Scale: correct / 2
    scaled = round(correct / 2)

    # Lookup IQ
    iq = SCORE_TO_IQ.get(scaled, 40)

    # Classify
    classification = classify_iq(iq)

    return {
        "raw_score": correct,
        "max_score": 100,
        "scaled_score": scaled,
        "iq": iq,
        "classification": classification,
        "section_scores": {
            "section_1": {"correct": section_1_correct, "max": 50},
            "section_2": {"correct": section_2_correct, "max": 50},
        },
        "phase_scores": phase_scores,
    }
