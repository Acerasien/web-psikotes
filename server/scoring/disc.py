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
        trait = option_trait.get(ans["option_id"])
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
    
    if total_most != expected:
        raise ValueError(f"Expected {expected} 'Most' selections, got {total_most}")
    if total_least != expected:
        raise ValueError(f"Expected {expected} 'Least' selections, got {total_least}")

    # Graph I: Raw "Most" scores (public self under pressure)
    # High score = trait prominently displayed when under pressure
    graph_i = most_scores.copy()

    # Graph II: Inverted "Least" scores (adapted self / social mask)
    # Inversion: max_possible - least_count = comfort level
    # High score = trait NOT rejected = comfortable with = part of social mask
    # Low score = trait frequently rejected = avoided = not natural to display
    max_possible = len(questions)  # 24
    graph_ii = {t: max_possible - least_scores[t] for t in traits}

    # Graph III: Integrated profile (average of I and II)
    # Used as primary reference for overall personality assessment
    graph_iii = {t: (graph_i[t] + graph_ii[t]) / 2 for t in traits}

    # Percentages: Graph III as % of maximum possible
    percentages = {t: (graph_iii[t] / max_possible) * 100 for t in traits}

    # Stress Gap: Maximum difference between Graph I and II
    # Indicates psychological stress from adapting to environment
    # <5: Low stress (authentic), 5-10: Moderate stress, >10: High stress
    stress_gap = max(abs(graph_i[t] - graph_ii[t]) for t in traits)

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
        "intensity_zones": intensity_zones
    }