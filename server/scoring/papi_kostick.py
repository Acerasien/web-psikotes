# server/scoring/papi_kostick.py
"""
PAPI Kostick scoring module.
Converts forced-choice answers into 20 norm scores, then to stanines (1-9).
Results grouped into 7 categories.
"""

# All 20 norms grouped into 7 categories
NORM_CATEGORIES = {
    "Work Direction - Arah Kerja": ["N", "G", "A"],
    "Leadership - Kepemimpinan": ["L", "P", "I"],
    "Activity - Aktivitas Kerja": ["T", "V"],
    "Social Nature - Relasi Sosial": ["O", "B", "S", "X"],
    "Work Style - Gaya Kerja": ["C", "D", "R"],
    "Temperament - Sifat Temperamen": ["Z", "E", "K"],
    "Followership - Posisi Atasan-Bawahan": ["F", "W"],
}

ALL_NORMS = ["N", "G", "A", "L", "P", "I", "T", "V", "O", "B", "S", "X", "C", "D", "R", "Z", "E", "K", "F", "W"]

NORM_DESCRIPTIONS = {
    "N": "Need to finish task — Kebutuhan menyelesaikan tugas secara mandiri",
    "G": "Hard intense worker — Peran pekerja keras",
    "A": "Need to achieve — Kebutuhan berprestasi",
    "L": "Leadership role — Peran kepemimpinan",
    "P": "Need to control others — Kebutuhan mengatur orang lain",
    "I": "Ease in decision making — Peran membuat keputusan",
    "T": "Pace — Peran sibuk",
    "V": "Vigorous type — Peran penuh semangat",
    "O": "Need for closeness — Kebutuhan kedekatan dan kasih sayang",
    "B": "Need to belong — Kebutuhan diterima dalam kelompok",
    "S": "Social extension — Peran hubungan sosial",
    "X": "Need to be noticed — Kebutuhan untuk diperhatikan",
    "C": "Organized type — Peran mengatur",
    "D": "Interest in details — Peran bekerja dengan hal-hal rinci",
    "R": "Theoretical type — Peran orang yang teoritis",
    "Z": "Need for change — Kebutuhan untuk berubah",
    "E": "Emotional resistant — Peran mengendalikan emosi",
    "K": "Need to be forceful — Kebutuhan untuk Agresif",
    "F": "Need to support authority — Kebutuhan membantu atasan",
    "W": "Need for rules — Kebutuhan mengikuti aturan dan pengawasan",
}

# Stanine cutoffs: percentage → stanine mapping
# Based on normal distribution: stanine 5 = 40-59%, etc.
STANINE_CUTOFFS = [
    (4, 1),    # 0-4% → stanine 1
    (11, 2),   # 5-10% → stanine 2
    (23, 3),   # 11-22% → stanine 3
    (40, 4),   # 23-39% → stanine 4
    (60, 5),   # 40-59% → stanine 5
    (77, 6),   # 60-76% → stanine 6
    (89, 7),   # 77-88% → stanine 7
    (95, 8),   # 89-94% → stanine 8
    (101, 9),  # 95-100% → stanine 9
]


def percentage_to_stanine(pct):
    """Convert a percentage (0-100) to a stanine (1-9)."""
    for threshold, stanine in STANINE_CUTOFFS:
        if pct < threshold:
            return stanine
    return 9


def score_papi_kostick(answers, questions):
    """
    Score PAPI Kostick forced-choice test.

    Args:
        answers: list of dicts with question_id, option_id, type
        questions: list of Question objects with options (each option has scoring_logic with 'norm')

    Returns:
        dict with:
            - raw_scores: dict of norm → raw count
            - max_scores: dict of norm → max possible (how many times each norm appears)
            - percentages: dict of norm → percentage (raw/max * 100)
            - stanines: dict of norm → stanine (1-9)
            - categories: dict of category_name → {norm: {raw, pct, stanine}}
            - all_norms: list of all 20 norm codes
    """
    # Initialize counters
    raw_scores = {norm: 0 for norm in ALL_NORMS}
    max_scores = {norm: 0 for norm in ALL_NORMS}

    # Build option lookup: option_id → norm
    option_norm_map = {}
    for q in questions:
        # Count max possible: each norm appearance in options counts as a possible point
        # But since each question has 2 options (A and B), the max per question is 1 point total
        # We count how many times each norm appears across all options
        for opt in q.options:
            if opt.scoring_logic and "norm" in opt.scoring_logic:
                norm = opt.scoring_logic["norm"]
                if norm in max_scores:
                    max_scores[norm] += 1
                option_norm_map[opt.id] = norm

    # Process answers
    for ans in answers:
        option_id = ans.get("option_id")
        if option_id and option_id in option_norm_map:
            norm = option_norm_map[option_id]
            if norm in raw_scores:
                raw_scores[norm] += 1

    # Calculate percentages
    percentages = {}
    for norm in ALL_NORMS:
        if max_scores[norm] > 0:
            percentages[norm] = round(raw_scores[norm] / max_scores[norm] * 100, 1)
        else:
            percentages[norm] = 0.0

    # Convert to stanines
    stanines = {}
    for norm in ALL_NORMS:
        stanines[norm] = percentage_to_stanine(percentages[norm])

    # Group by categories
    categories = {}
    for category_name, norms in NORM_CATEGORIES.items():
        categories[category_name] = {}
        for norm in norms:
            categories[category_name][norm] = {
                "raw": raw_scores[norm],
                "max": max_scores[norm],
                "percentage": percentages[norm],
                "stanine": stanines[norm],
                "description": NORM_DESCRIPTIONS.get(norm, ""),
            }

    # Compute primary trait(s) — highest percentage, join ties with '&'
    max_pct = max(percentages.values())
    top_norms = [norm for norm in ALL_NORMS if percentages[norm] == max_pct]
    # Format as "NORM (description)" or "NORM & NORM" if tied
    if len(top_norms) == 1:
        primary_trait = f"{top_norms[0]} ({NORM_DESCRIPTIONS.get(top_norms[0], '')})"
    else:
        # For ties, show just the norm codes joined
        primary_trait = " & ".join(top_norms)

    return {
        "raw_scores": raw_scores,
        "max_scores": max_scores,
        "percentages": percentages,
        "stanines": stanines,
        "categories": categories,
        "all_norms": ALL_NORMS,
        "norm_descriptions": NORM_DESCRIPTIONS,
        "primary_trait": primary_trait,
    }
