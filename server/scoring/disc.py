# server/scoring/disc.py

def score_disc(answers, questions):
    """
    Score DISC assessment and return comprehensive profile.
    
    DISC Methodology:
    - Graph I (Most): Public self / behavior under pressure - traits selected as "Most"
    - Graph II (Least): Adapted self / social mask - traits NOT selected as "Least" 
      (inverted to show comfort level: high score = comfortable, low score = avoided)
    - Graph III (Integrated): Overall profile - average of I and II, used for primary interpretation
    
    Args:
        answers: list of dicts with keys: question_id, option_id, type ('most' or 'least')
        questions: list of Question objects with options (scoring_logic contains {"trait": "D/I/S/C"})
    
    Returns:
        dict with graph_i, graph_ii, graph_iii, percentages, stress_gap, intensity_zones
    """
    traits = ["D", "I", "S", "C"]
    most_scores = {t: 0 for t in traits}
    least_scores = {t: 0 for t in traits}

    # Build lookup: option_id -> trait
    option_trait = {}
    for q in questions:
        for opt in q.options:
            option_trait[opt.id] = opt.scoring_logic.get("trait")

    # Aggregate scores
    for ans in answers:
        option_id = ans.get("option_id") if isinstance(ans, dict) else None
        trait = option_trait.get(option_id)
        if not trait:
            continue
        if ans["type"] == "most":
            most_scores[trait] += 1
        elif ans["type"] == "least":
            least_scores[trait] += 1

    # Validate: total selections should match question count (24)
    total_most = sum(most_scores.values())
    total_least = sum(least_scores.values())
    expected = len(questions)
    
    is_valid = (total_most == expected and total_least == expected)
    if not is_valid:
        print(f"Warning: DISC test incomplete. Expected {expected}, got Most={total_most}, Least={total_least}")

    # Graph I: Raw "Most" scores (public self under pressure)
    # High score = trait prominently displayed when under pressure
    graph_i = most_scores.copy()

    # Graph II: Raw "Least" scores (private self / core)
    # Standard DISC outputs raw least count.
    graph_ii = least_scores.copy()

    # Graph III: Integrated profile (MOST - LEAST)
    # Used as primary reference for overall personality assessment (range: -24 to +24)
    graph_iii = {t: graph_i[t] - graph_ii[t] for t in traits}

    # Percentages: Convert Graph III (-24 to +24) to a 0-100 percentage
    max_possible = len(questions)  # 24
    percentages = {t: ((graph_iii[t] + max_possible) / (max_possible * 2)) * 100 for t in traits}

    # Stress Gap: Maximum difference between Graph I and inverted Graph II
    # Indicates psychological stress from adapting to environment
    # <5: Low stress (authentic), 5-10: Moderate stress, >10: High stress
    stress_gap = max(abs(graph_i[t] - (max_possible - graph_ii[t])) for t in traits)

    # --- Interval Classification Logic ---
    def get_level_most_least(val):
        if val >= 17: return "Tinggi"
        if val >= 8: return "Sedang"
        return "Rendah"

    def get_level_integrated(val):
        if val >= 9: return "Tinggi"
        if val >= -8: return "Sedang"
        return "Rendah"

    levels = {
        "graph_i": {t: get_level_most_least(graph_i[t]) for t in traits},
        "graph_ii": {t: get_level_most_least(24 - graph_ii[t]) for t in traits}, # Inverted: High Least = Low Intensity
        "graph_iii": {t: get_level_integrated(graph_iii[t]) for t in traits}
    }

    # Intensity Zones (legacy compatibility, maps to Graph III levels)
    intensity_zones = {t: levels["graph_iii"][t] for t in traits}

    return {
        "graph_i": graph_i,
        "graph_ii": graph_ii,
        "graph_iii": graph_iii,
        "percentages": percentages,
        "stress_gap": stress_gap,
        "intensity_zones": intensity_zones,
        "levels": levels,
        "is_valid": is_valid
    }