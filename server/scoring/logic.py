# server/scoring/logic.py

WPT_MAPPING = [
    {
        "min": 41, "max": 50, "iq": "> 150", "percentile": "> 99%",
        "classification": "Gifted / Genius", "range": "Jenius",
        "description": "Skor tertinggi; sangat cocok posisi paling kompleks",
        "recommendation": "Posisi paling kompleks / penelitian"
    },
    {
        "min": 36, "max": 40, "iq": "141-150", "percentile": "98-99%",
        "classification": "Sangat Superior", "range": "Luar Biasa",
        "description": "Sangat jarang; potensi intelektual luar biasa",
        "recommendation": "Posisi strategis / peneliti"
    },
    {
        "min": 31, "max": 35, "iq": "131-140", "percentile": "93-97%",
        "classification": "Superior", "range": "Sangat Tinggi",
        "description": "Kemampuan analitis sangat baik",
        "recommendation": "Eksekutif / profesional senior"
    },
    {
        "min": 26, "max": 30, "iq": "116-130", "percentile": "79-92%",
        "classification": "Tinggi (High Average - Superior)", "range": "Tinggi",
        "description": "Kapasitas kognitif tinggi; cocok posisi teknis & manajerial",
        "recommendation": "Manajer / teknisi senior"
    },
    {
        "min": 23, "max": 25, "iq": "106-115", "percentile": "61-78%",
        "classification": "Di Atas Rata-Rata", "range": "Baik",
        "description": "Mampu belajar cepat dan memecahkan masalah dengan baik",
        "recommendation": "Supervisor / analis junior"
    },
    {
        "min": 20, "max": 22, "iq": "95-105", "percentile": "41-60%",
        "classification": "Rata-Rata (Average)", "range": "Normal",
        "description": "Kemampuan umum normal; cocok untuk pekerjaan standar",
        "recommendation": "Pekerjaan standar / administrasi"
    },
    {
        "min": 17, "max": 19, "iq": "85-94", "percentile": "21-40%",
        "classification": "Rata-Rata Bawah", "range": "Cukup",
        "description": "Kemampuan kognitif cukup untuk pekerjaan rutin",
        "recommendation": "Staf/operator umum"
    },
    {
        "min": 14, "max": 16, "iq": "80-84", "percentile": "13-20%",
        "classification": "Rendah (Low Average)", "range": "Di Bawah Rata-Rata",
        "description": "Di bawah rata-rata; butuh instruksi sederhana dan berulang",
        "recommendation": "Pekerjaan operasional sederhana"
    },
    {
        "min": 11, "max": 13, "iq": "71-79", "percentile": "8-12%",
        "classification": "Borderline / Lambat Belajar", "range": "Batas Bawah Normal",
        "description": "Fungsi intelektual batas bawah; kesulitan belajar bermakna",
        "recommendation": "Pekerjaan rutin dengan bimbingan"
    },
    {
        "min": 8, "max": 10, "iq": "65-70", "percentile": "5-7%",
        "classification": "Intellectual Disability - Ringan", "range": "Rendah",
        "description": "Ambang bawah disabilitas intelektual; literasi sangat terbatas",
        "recommendation": "Pekerjaan manual sederhana"
    },
    {
        "min": 5, "max": 7, "iq": "55-65", "percentile": "1-5%",
        "classification": "Intellectual Disability - Sedang", "range": "Sangat Rendah",
        "description": "Disabilitas intelektual sedang; butuh pendampingan intensif",
        "recommendation": "Pekerjaan dengan pendampingan penuh"
    },
    {
        "min": 0, "max": 4, "iq": "< 55", "percentile": "< 1%",
        "classification": "Intellectual Disability - Berat", "range": "Sangat Sangat Rendah",
        "description": "Disabilitas intelektual berat; sangat terbatas dalam pemrosesan informasi",
        "recommendation": "Tidak dapat bekerja mandiri"
    }
]

def get_wpt_interpretation(score):
    for mapping in WPT_MAPPING:
        if mapping["min"] <= score <= mapping["max"]:
            return mapping
    return WPT_MAPPING[-1] # Fallback to lowest

def score_logic(answers, questions):
    """
    answers: list of dicts with question_id, option_id, type ('single' or 'multi')
    questions: list of Question objects with options

    Returns dict with WPT standard metrics.
    """
    correct_options = {}
    multi_select_questions = {}
    
    for q in questions:
        is_multi_select = q.meta_data.get("multi_select", False) if q.meta_data else False
        correct_ids = []
        for opt in q.options:
            if opt.scoring_logic.get("correct"):
                correct_ids.append(opt.id)
        if correct_ids:
            correct_options[q.id] = correct_ids
            if is_multi_select:
                multi_select_questions[q.id] = True

    correct = 0
    answers_by_question = {}
    for ans in answers:
        q_id = ans.get("question_id")
        if q_id not in answers_by_question:
            answers_by_question[q_id] = []
        answers_by_question[q_id].append(ans)
    
    for q_id, q_answers in answers_by_question.items():
        is_multi = multi_select_questions.get(q_id, False)
        
        if is_multi:
            selected_option_ids = set()
            for ans in q_answers:
                option_id = ans.get("option_id")
                if option_id:
                    option_id_str = str(option_id)
                    if "," in option_id_str:
                        for id_part in option_id_str.split(","):
                            selected_option_ids.add(int(id_part.strip()))
                    else:
                        selected_option_ids.add(int(option_id))
            
            correct_ids = set(correct_options.get(q_id, []))
            if selected_option_ids == correct_ids:
                correct += 1
        else:
            for ans in q_answers:
                if ans.get("option_id") == correct_options.get(q_id, [None])[0]:
                    correct += 1
                    break

    # Calculate WPT Metrics
    interpretation = get_wpt_interpretation(correct)
    
    return {
        "score": correct * 2, # Weighted score (2 pts each) to reach max 100
        "correct_count": correct,
        "total_answered": len(answers_by_question),
        "percentage": round((correct / 50 * 100), 2),
        "band": interpretation["range"],
        "est_iq": interpretation["iq"],
        "percentile": interpretation["percentile"],
        "classification": interpretation["classification"],
        "description": interpretation["description"],
        "recommendation": interpretation["recommendation"]
    }