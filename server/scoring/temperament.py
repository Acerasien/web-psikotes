# server/scoring/temperament.py

INTERPRETATIONS = {
    "Choleric": "Berdasarkan hasil tes, testee menunjukkan dominansi temperamen Choleric, yaitu individu yang tegas, fokus, dan berorientasi pada tujuan.\nIndividu dengan temperamen koleris adalah pribadi yang bertekad kuat dan fokus pada pencapaian, menjadikannya pemimpin yang efektif. Meskipun mereka mungkin perlu mengembangkan empati dan keterampilan interpersonal, dorongan dan dedikasi mereka adalah aset berharga untuk mencapai tujuan dan menginspirasi orang lain.",
    "Phlegmatic": "Berdasarkan hasil tes, testee menunjukkan dominansi temperamen Plegmatis, yaitu individu yang cenderung tenang, sabar, dan harmonis.\nIndividu dengan temperamen plegmatis adalah sosok yang stabil, penuh empati, dan mampu menciptakan lingkungan kerja yang damai. Meskipun mereka mungkin perlu mengembangkan motivasi dan keterbukaan dalam komunikasi, keandalan dan sikap tenang mereka adalah aset penting dalam membangun kerja sama dan ketahanan tim.",
    "Melancholic": "Berdasarkan hasil tes, testee menunjukkan dominansi temperament Melancholis, yaitu individu yang analitis, reflektif dan perfeksionis.\nIndividu dengan temperamen melankolis adalah pribadi yang terstruktur, empatik dan berdedikasi tinggi. Walaupun mereka mungkin perlu mengelola emosi negatif dan mengurangi perfeksionis, kedalaman analitis dan ketajaman perasaan mereka memberikan kontribusi signifikan dalam pekerjaan yang menuntut ketelitian dan kepekaan.",
    "Sanguine": "Berdasarkan hasil tes, testee menunjukkan dominansi temperamen Sanguin, yaitu individu yang ramah, optimis, dan penuh semangat.\nIndividu dengan temperamen sanguin adalah sosok yang energik, komunikatif, dan inspiratif. Meskipun mereka perlu meningkatkan disiplin dan konsistensi, semangat dan keterbukaan mereka menjadi kekuatan penting dalam membangun semangat tim dan menciptakan suasana kerja yang positif."
}

def get_category(score):
    if score >= 23:
        return "Tinggi"
    elif score >= 14:
        return "Sedang"
    else:
        return "Rendah"

def score_temperament(answers, questions):
    """
    answers: list of dicts with keys: question_id, option_id, type (should be 'single')
    questions: list of Question objects with options (each option has scoring_logic with "trait" and "value")
    
    Returns a dict with:
        - raw_scores: dict of trait sums
        - percentages: dict of trait percentages (0-100)
        - categories: dict of trait categories (Rendah, Sedang, Tinggi)
        - primary: trait with highest percentage
        - secondary: trait with second highest
        - interpretation_text: descriptive text for primary trait
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

    # Normalize to percentages and calculate categories
    percentages = {}
    categories = {}
    for trait in trait_map.keys():
        trait_name = trait_map[trait]
        max_possible = 6 * 5  # 6 questions per trait, each max 5
        answered = count[trait]
        
        if answered > 0:
            percentages[trait_name] = (raw[trait] / 30) * 100
        else:
            percentages[trait_name] = 0
            
        categories[trait_name] = get_category(raw[trait])

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
        
    # Set interpretation text based on primary trait
    interpretation_text = INTERPRETATIONS.get(primary, "")

    return {
        "raw_scores": raw,
        "percentages": percentages,
        "categories": categories,
        "primary": primary,
        "secondary": secondary,
        "interpretation_text": interpretation_text,
        "interactions": interactions,
        "straight_line_flag": straight_line_flag
    }