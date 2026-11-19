"""
resume_audit.py — Full standalone resume analysis (no JD required).
Runs all modules: ATS, score card, skills, bullet review, summarizer, role prediction.
"""

import re
from typing import Dict, List


def full_audit(resume_text: str) -> Dict:
    """Run all analysis modules on the resume without a job description."""
    from nlp_engine import (
        extract_and_categorize_skills, generate_resume_summary,
        compute_ats_score, analyze_resume_job_match, ACTION_VERBS,
    )
    from score_card import compute_score_card
    from role_predictor import predict_roles

    # 1. Score Card (5-dimension grading)
    card = compute_score_card(resume_text)

    # 2. Skills extraction
    skills = extract_and_categorize_skills(resume_text)

    # 3. ATS score (use a generic JD so the ATS structural checks still run)
    generic_jd = (
        "Software engineer developer with experience in programming, "
        "problem solving, communication, teamwork, project management, "
        "Python, JavaScript, SQL, Git, agile, REST API, cloud, testing, "
        "data structures, algorithms, documentation, leadership"
    )
    match_r = analyze_resume_job_match(resume_text, generic_jd)
    ats = compute_ats_score(resume_text, generic_jd, match_r["score"])

    # 4. Bullet review
    bullets = _analyze_bullets(resume_text, ACTION_VERBS)

    # 5. Summary
    try:
        summary = generate_resume_summary(resume_text)
    except Exception:
        summary = {"summary": "", "original_word_count": len(resume_text.split()), "summary_word_count": 0}

    # 6. Role prediction
    roles = predict_roles(resume_text)

    # 7. Quick stats
    word_count = len(resume_text.split())
    line_count = len([l for l in resume_text.split("\n") if l.strip()])
    has_email = bool(re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", resume_text))
    has_phone = bool(re.search(r"\b\d{10}\b|\+\d{1,3}[\s-]?\d{4,}", resume_text))
    has_linkedin = bool(re.search(r"linkedin\.com/in/", resume_text, re.IGNORECASE))
    has_github = bool(re.search(r"github\.com/", resume_text, re.IGNORECASE))

    return {
        "score_card": card,
        "ats": {
            "ats_score": ats["ats_score"],
            "recommendation": ats["recommendation"],
            "breakdown": ats["breakdown"],
            "improvements": ats["improvements"],
            "details": ats.get("details"),
        },
        "skills": skills,
        "bullets": {
            "items": bullets,
            "total": len(bullets),
            "average_score": round(sum(b["score"] for b in bullets) / max(len(bullets), 1), 1),
            "strong": sum(1 for b in bullets if b["rating"] == "Strong"),
            "weak": sum(1 for b in bullets if b["rating"] in ("Weak", "Needs Work")),
        },
        "summary": summary,
        "roles": roles,
        "stats": {
            "word_count": word_count,
            "line_count": line_count,
            "has_email": has_email,
            "has_phone": has_phone,
            "has_linkedin": has_linkedin,
            "has_github": has_github,
        },
    }


def _analyze_bullets(text: str, action_verbs: set) -> List[Dict]:
    results = []
    for line in text.split("\n"):
        s = line.strip()
        if not s or len(s) < 10 or s[0] not in "-*":
            continue
        clean = re.sub(r"^[-*]\s*", "", s).strip()
        if len(clean) < 10:
            continue
        words = clean.split()
        first = words[0].lower() if words else ""
        has_verb = first in action_verbs
        has_num = bool(re.search(r"\d+", clean))
        wc = len(words)
        score = 20 + (25 if has_verb else 0) + (20 if has_num else 0) + (15 if 8 <= wc <= 25 else 0) + 10
        tips = []
        if not has_verb: tips.append("Start with a strong action verb")
        if not has_num: tips.append("Add measurable impact (numbers, %)")
        if wc < 8: tips.append("Add more detail")
        if wc > 25: tips.append("Make more concise")
        rating = "Strong" if score >= 70 else "Good" if score >= 50 else "Needs Work" if score >= 35 else "Weak"
        results.append({"text": clean, "score": min(score, 100), "rating": rating,
                        "has_action_verb": has_verb, "has_metrics": has_num, "tips": tips})
    return results
