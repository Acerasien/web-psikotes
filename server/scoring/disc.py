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

    # Intensity Zones: Classify each trait based on Graph III percentage
    # High (>70%): Prominent trait, Medium (30-70%): Moderate, Low (<30%): Minimal
    intensity_zones = {}
    for t in traits:
        p = percentages[t]
        if p > 70:
            zone = "High"
        elif p < 30:
            zone = "Low"
        else:
            zone = "Medium"
        intensity_zones[t] = zone

    return {
        "graph_i": graph_i,
        "graph_ii": graph_ii,
        "graph_iii": graph_iii,
        "percentages": percentages,
        "stress_gap": stress_gap,
        "intensity_zones": intensity_zones,
        "is_valid": is_valid
    }