# server/scoring/temperament.py
def score_temperament(answers, questions):
    """
    answers: list of dicts with keys: question_id, option_id, type (should be 'single')
    questions: list of Question objects with options (each option has scoring_logic with "trait" and "value")
    
    Returns a dict with:
        - raw_scores: dict of trait sums
        - percentages: dict of trait percentages (0-100)
        - primary: trait with highest percentage
        - secondary: trait with second highest
        - interactions: list of trait combination descriptions (optional)
        - straight_line_flag: boolean if all answers are identical
    """
    trait_map = {"S": "Sanguine", "C": "Choleric", "M": "Melancholic", "P": "Phlegmatic"}
    # Initialize sums
    raw = {t: 0 for t in trait_map.keys()}
    count = {t: 0 for t in trait_map.keys()}  # number of questions answered per trait

    # Build lookup for option details
    option_details = {}
    for q in questions:
        for opt in q.options:
            option_details[opt.id] = {
                "trait": opt.scoring_logic.get("trait"),
                "value": opt.scoring_logic.get("value", 0)
            }

    # Also collect all selected values for straight-line detection
    selected_values = []

    for ans in answers:
        if ans.get("type") == "single":
            opt_id = ans["option_id"]
            details = option_details.get(opt_id)
            if details:
                trait = details["trait"]
                value = details["value"]
                raw[trait] += value
                count[trait] += 1
                selected_values.append(value)

    # Normalize to percentages (max possible per trait = 7 questions * 6 = 42)
    percentages = {}
    for trait in trait_map.keys():
        max_possible = 7 * 6  # 7 questions per trait, each max 6
        # If some questions unanswered, adjust max? For now assume all answered.
        # But if not all answered, we should scale accordingly.
        answered = count[trait]
        if answered > 0:
            # Scale to percentage of maximum possible for answered questions
            # Actually we want percentage based on max possible (42) for consistency.
            # But if some questions missing, the raw sum is out of (answered*6).
            # Better to compute percentage based on answered questions to be fair.
            # Let's do: percentage = (raw[trait] / (answered * 6)) * 100
            # Then average across answered? But spec says normalize to 0-100% based on max possible points for that trait.
            # Since each trait has 7 questions, max = 42.
            # So percentage = (raw[trait] / 42) * 100.
            # This penalizes missing questions, but we assume they answered all.
            percentages[trait_map[trait]] = (raw[trait] / 42) * 100
        else:
            percentages[trait_map[trait]] = 0

    # Determine primary and secondary
    sorted_traits = sorted(percentages.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_traits[0][0] if sorted_traits else None
    secondary = sorted_traits[1][0] if len(sorted_traits) > 1 else None

    # Straight-line check: all selected values the same?
    straight_line_flag = False
    if selected_values:
        straight_line_flag = all(v == selected_values[0] for v in selected_values)

    # Optional interactions (can be expanded later)
    interactions = []
    if primary and secondary:
        interactions.append(f"{primary} utama dengan nuansa {secondary}")

    return {
        "raw_scores": raw,
        "percentages": percentages,
        "primary": primary,
        "secondary": secondary,
        "interactions": interactions,
        "straight_line_flag": straight_line_flag
    }