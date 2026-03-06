# server/scoring/leadership.py
def score_leadership(answers, questions):
    """
    answers: list of dicts with question_id, option_id, type='single'
    questions: list of Question objects with options (each option has scoring_logic as dict of trait: points)

    Returns a dict with:
        - raw_scores: dict of trait sums
        - max_possible: dict of maximum possible sums per trait (based on highest option per question)
        - percentages: dict of trait percentages (raw / max * 100)
        - primary: trait with highest percentage
        - secondary: trait with second highest percentage
        - development_areas: list of traits with percentage < 40
    """
    # Define all possible traits (keep consistent with seed)
    traits = ["DEC", "COM", "STR", "TEA", "ACC", "EMO"]
    raw = {t: 0 for t in traits}
    max_possible = {t: 0 for t in traits}

    # Build a lookup for option contributions
    option_contrib = {}
    for q in questions:
        # For each question, find the maximum possible contribution per trait (to compute max_possible)
        q_max = {t: 0 for t in traits}
        for opt in q.options:
            contrib = opt.scoring_logic
            option_contrib[opt.id] = contrib
            for trait, points in contrib.items():
                if points > q_max[trait]:
                    q_max[trait] = points
        # Add this question's max to the global max_possible
        for trait, val in q_max.items():
            max_possible[trait] += val

    # Process participant's answers
    for ans in answers:
        if ans.get("type") == "single":
            contrib = option_contrib.get(ans["option_id"], {})
            for trait, points in contrib.items():
                raw[trait] += points

    # Compute percentages (handle division by zero)
    percentages = {}
    for trait in traits:
        if max_possible[trait] > 0:
            percentages[trait] = (raw[trait] / max_possible[trait]) * 100
        else:
            percentages[trait] = 0

    # Determine primary and secondary
    sorted_traits = sorted(traits, key=lambda t: percentages[t], reverse=True)
    primary = sorted_traits[0]
    secondary = sorted_traits[1] if len(sorted_traits) > 1 else None

    # Development areas (percentage < 40)
    development_areas = [t for t in traits if percentages[t] < 40]

    return {
        "raw_scores": raw,
        "max_possible": max_possible,
        "percentages": percentages,
        "primary": primary,
        "secondary": secondary,
        "development_areas": development_areas
    }