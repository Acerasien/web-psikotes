# server/scoring/cbi.py
"""
Counterproductive Behavior Indeks (CBI) scoring module.
Calculates raw scores based on Option scoring logic (Benar/Salah).
Maps raw scores to explicit categorical levels (White, Light Blue, Dark Blue).
"""

PRIMARY_CONCERNS = [
    "Dependability",
    "Aggression",
    "Substance Abuse",
    "Honesty",
    "Computer Abuse",
    "Sexual Harassment"
]

ALL_CONCERNS = PRIMARY_CONCERNS + ["Good Impression"]

THRESHOLDS = {
    "Dependability": [(4, "White"), (9, "Light Blue"), (22, "Dark Blue")],
    "Aggression": [(8, "White"), (12, "Light Blue"), (24, "Dark Blue")],
    "Substance Abuse": [(4, "White"), (9, "Light Blue"), (22, "Dark Blue")],
    "Honesty": [(8, "White"), (12, "Light Blue"), (23, "Dark Blue")],
    "Computer Abuse": [(5, "White"), (9, "Light Blue"), (17, "Dark Blue")],
    "Sexual Harassment": [(8, "White"), (11, "Light Blue"), (22, "Dark Blue")],
    "Good Impression": [(3, "White"), (6, "Light Blue"), (10, "Dark Blue")]
}

OVERALL_THRESHOLDS = [(38, "White"), (59, "Light Blue"), (140, "Dark Blue")]

def get_level(score: int, thresholds: list) -> str:
    """Returns the level string based on thresholds mapping."""
    for limit, level in thresholds:
        if score <= limit:
            return level
    # Fallback to the highest if somehow exceeded
    return thresholds[-1][1]


def score_cbi_test(answers, questions):
    """
    Score the CBI test.

    Args:
        answers: list of dicts with question_id, option_id
        questions: list of Question DB objects with options
    
    Returns:
        dict: The mapped JSON output for Result.details
    """
    raw_scores = {concern: 0 for concern in ALL_CONCERNS}

    # Map options for O(1) lookup
    option_logic_map = {}
    for q in questions:
        for opt in q.options:
            if opt.scoring_logic:
                option_logic_map[opt.id] = opt.scoring_logic

    # Tally up points
    for ans in answers:
        option_id = ans.get("option_id")
        if option_id in option_logic_map:
            logic = option_logic_map[option_id]
            trait = logic.get("trait")
            score = logic.get("score", 0)
            if trait in raw_scores:
                raw_scores[trait] += score

    # Overall concern score
    overall_score = sum(raw_scores[trait] for trait in ALL_CONCERNS)
    overall_level = get_level(overall_score, OVERALL_THRESHOLDS)

    # Classifications per trait
    results = {}
    for trait in ALL_CONCERNS:
        score = raw_scores[trait]
        level = get_level(score, THRESHOLDS[trait])
        results[trait] = {
            "score": score,
            "level": level
        }

    return {
        "primary_concerns": {trait: results[trait] for trait in PRIMARY_CONCERNS},
        "good_impression": results["Good Impression"],
        "overall_concern": {
            "score": overall_score,
            "level": overall_level
        },
        # For standard summary display compatibility
        "score": overall_score 
    }
