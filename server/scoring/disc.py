# server/scoring/disc.py
def score_disc(answers, questions):
    """
    answers: list of dicts with keys: question_id, option_id, selection_type ('most' or 'least')
    questions: list of Question objects with their options (each option has scoring_logic like {"trait": "D"})
    
    Returns a dict with:
        - graph_i: dict of trait scores from MOST selections (raw counts)
        - graph_ii: dict of trait scores from LEAST selections (inverse)
        - graph_iii: dict of integrated scores (average of I and II)
        - percentages: dict of trait percentages (based on max possible)
        - stress_gap: maximum difference between I and II
        - intensity_zones: classification per trait (High/Medium/Low)
    """
    traits = ["D", "I", "S", "C"]
    most_scores = {t: 0 for t in traits}
    least_scores = {t: 0 for t in traits}
    
    # Build a lookup for option traits
    option_trait = {}
    for q in questions:
        for opt in q.options:
            option_trait[opt.id] = opt.scoring_logic.get("trait")
    
    # Aggregate
    for ans in answers:
        trait = option_trait.get(ans["option_id"])
        if not trait:
            continue
        if ans["type"] == "most":           # <-- CHANGED HERE
            most_scores[trait] += 1
        elif ans["type"] == "least":        # <-- CHANGED HERE
            least_scores[trait] += 1
    
    # Graph I: most scores (raw)
    graph_i = most_scores.copy()
    
    # Graph II: least scores (inverse: how many times NOT chosen as least)
    max_possible = len(questions)  # 24
    graph_ii = {t: max_possible - least_scores[t] for t in traits}
    
    # Graph III: average of I and II
    graph_iii = {t: (graph_i[t] + graph_ii[t]) / 2 for t in traits}
    
    # Percentages (based on max possible)
    percentages = {t: (graph_iii[t] / max_possible) * 100 for t in traits}
    
    # Stress gap: max difference between I and II for any trait
    stress_gap = max(abs(graph_i[t] - graph_ii[t]) for t in traits)
    
    # Intensity zones
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