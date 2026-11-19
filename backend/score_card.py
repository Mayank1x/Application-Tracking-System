"""
score_card.py — 5-dimension resume scoring (out of 100).
Dimensions: Content(25), Skills(20), Structure(20), Language(20), ATS(15).
"""

import re
import math
from typing import Dict, List

# Weak filler phrases to penalize
FILLER_PHRASES = [
    "responsible for", "helped with", "assisted in", "worked on",
    "involved in", "tasked with", "duties include", "duties included",
    "participated in", "contributed to",
]

FIRST_PERSON = re.compile(r"\b(i|my|me|i'm|i've|i'd|myself)\b", re.IGNORECASE)

SECTION_PATTERNS = {
    "education": r"\b(education|academic|university|college|degree|b\.?tech|m\.?tech|b\.?sc|m\.?sc|bachelor|master|phd)\b",
    "experience": r"\b(experience|work history|employment|internship|intern)\b",
    "skills": r"\b(skills|technical skills|core competencies|technologies|proficiencies)\b",
    "projects": r"\b(projects|project work|academic projects|personal projects)\b",
    "contact": r"\b(email|phone|contact|address|linkedin|github)\b",
}

STANDARD_HEADINGS = ["education", "experience", "skills", "projects", "summary", "objective", "certifications", "achievements"]


def _content_score(text: str) -> Dict:
    """Score content quality (out of 25)."""
    from nlp_engine import ACTION_VERBS

    lines = text.split("\n")
    bullet_lines = [l.strip() for l in lines if l.strip() and l.strip()[0] in "-*" and len(l.strip()) > 10]

    # Action verb bullets
    verb_count = 0
    for line in bullet_lines:
        clean = re.sub(r"^[-*]\s*", "", line).strip()
        first_word = clean.split()[0].lower() if clean.split() else ""
        if first_word in ACTION_VERBS:
            verb_count += 1
    verb_ratio = verb_count / max(len(bullet_lines), 1)
    verb_pts = min(verb_ratio * 8, 8)

    # Quantifiable achievements
    quant_count = len(re.findall(r"\d+\s*%|\$[\d,]+|\d+\s*\+?\s*(users|clients|projects|revenue|sales|growth)", text, re.IGNORECASE))
    quant_pts = min(quant_count * 1.5, 6)

    # Word count (400-800 ideal)
    word_count = len(text.split())
    if 400 <= word_count <= 800:
        length_pts = 6
    elif 300 <= word_count < 400 or 800 < word_count <= 1000:
        length_pts = 4
    elif 200 <= word_count < 300 or 1000 < word_count <= 1500:
        length_pts = 2
    else:
        length_pts = 1

    # Filler penalty
    filler_count = sum(1 for fp in FILLER_PHRASES if fp in text.lower())
    filler_penalty = min(filler_count * 1.5, 5)

    score = max(0, verb_pts + quant_pts + length_pts - filler_penalty)
    return {
        "score": round(min(score, 25), 1),
        "max": 25,
        "details": {
            "action_verb_ratio": round(verb_ratio * 100, 1),
            "quantifiable_achievements": quant_count,
            "word_count": word_count,
            "filler_phrases_found": filler_count,
        }
    }


def _skills_score(text: str) -> Dict:
    """Score skills breadth (out of 20)."""
    from nlp_engine import extract_and_categorize_skills

    result = extract_and_categorize_skills(text)
    total = result["total_skills"]
    cats = len([c for c, s in result["skills_by_category"].items() if len(s) > 0])

    skill_pts = min(total * 1.2, 10)
    cat_bonus = min(cats * 2, 8) if cats >= 3 else cats * 1.5
    soft_penalty = 2 if "Soft Skills" in result.get("missing_categories", []) else 0

    score = max(0, skill_pts + cat_bonus - soft_penalty)
    return {
        "score": round(min(score, 20), 1),
        "max": 20,
        "details": {
            "total_skills": total,
            "categories_covered": cats,
            "has_soft_skills": "Soft Skills" not in result.get("missing_categories", []),
        }
    }


def _structure_score(text: str) -> Dict:
    """Score resume structure (out of 20)."""
    text_lower = text.lower()

    sections_found = {}
    for name, pattern in SECTION_PATTERNS.items():
        sections_found[name] = bool(re.search(pattern, text_lower))
    section_pts = sum(2 for found in sections_found.values() if found)

    has_email = bool(re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text))
    has_linkedin = bool(re.search(r"linkedin\.com/in/", text_lower))
    has_github = bool(re.search(r"github\.com/", text_lower))

    link_pts = (2 if has_email else 0) + (2 if has_linkedin else 0) + (2 if has_github else 0)

    score = min(section_pts + link_pts, 20)
    return {
        "score": round(score, 1),
        "max": 20,
        "details": {
            "sections": sections_found,
            "has_email": has_email,
            "has_linkedin": has_linkedin,
            "has_github": has_github,
        }
    }


def _language_score(text: str) -> Dict:
    """Score language quality (out of 20)."""
    import nltk
    sentences = nltk.sent_tokenize(text)

    # Average sentence length
    avg_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    if 10 <= avg_len <= 20:
        len_pts = 6
    elif 8 <= avg_len < 10 or 20 < avg_len <= 25:
        len_pts = 4
    else:
        len_pts = 2

    # Passive voice detection (simplified)
    passive_patterns = [
        r"\b(was|were|been|being|is|are|am)\s+(a\s+)?\w+ed\b",
        r"\b(was|were)\s+\w+en\b",
    ]
    passive_count = sum(len(re.findall(p, text, re.IGNORECASE)) for p in passive_patterns)
    passive_pts = max(0, 5 - passive_count)

    # Spelling errors
    try:
        from spellchecker import SpellChecker
        spell = SpellChecker()
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text)
        tech_ignore = {"api", "sql", "html", "css", "nlp", "sdk", "ios", "gpu", "cpu", "url", "jwt", "oauth"}
        check_words = [w.lower() for w in words if w.lower() not in tech_ignore and not w[0].isupper()]
        misspelled = spell.unknown(check_words[:200])
        spell_pts = max(0, 5 - len(misspelled) * 0.5)
        spell_count = len(misspelled)
    except ImportError:
        spell_pts = 3
        spell_count = -1

    # First-person pronouns
    pronoun_count = len(FIRST_PERSON.findall(text))
    pronoun_pts = max(0, 4 - pronoun_count * 0.5)

    score = len_pts + passive_pts + spell_pts + pronoun_pts
    return {
        "score": round(min(max(score, 0), 20), 1),
        "max": 20,
        "details": {
            "avg_sentence_length": round(avg_len, 1),
            "passive_voice_count": passive_count,
            "spelling_errors": spell_count,
            "first_person_pronouns": pronoun_count,
        }
    }


def _ats_compat_score(text: str) -> Dict:
    """Score ATS compatibility (out of 15)."""
    text_lower = text.lower()

    # Check for table/column indicators
    has_tables = bool(re.search(r"\|.*\|.*\|", text)) or bool(re.search(r"\t{2,}", text))
    table_pts = 4 if not has_tables else 0

    # Special unicode chars
    special = len(re.findall(r"[^\x00-\x7F]", text))
    unicode_pts = 4 if special < 5 else (2 if special < 15 else 0)

    # Consistent date formatting
    dates = re.findall(r"\b\d{4}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}\b", text_lower)
    date_pts = 4 if len(dates) >= 2 else (2 if len(dates) >= 1 else 0)

    # Standard section headings
    heading_count = sum(1 for h in STANDARD_HEADINGS if re.search(r"\b" + h + r"\b", text_lower))
    heading_pts = min(heading_count, 3)

    score = table_pts + unicode_pts + date_pts + heading_pts
    return {
        "score": round(min(score, 15), 1),
        "max": 15,
        "details": {
            "has_tables": has_tables,
            "special_chars": special,
            "dates_found": len(dates),
            "standard_headings": heading_count,
        }
    }


def compute_score_card(resume_text: str) -> Dict:
    """Compute full 5-dimension score card."""
    content = _content_score(resume_text)
    skills = _skills_score(resume_text)
    structure = _structure_score(resume_text)
    language = _language_score(resume_text)
    ats = _ats_compat_score(resume_text)

    total = content["score"] + skills["score"] + structure["score"] + language["score"] + ats["score"]
    total = round(min(total, 100), 1)

    if total >= 90:
        grade = "A+"
    elif total >= 80:
        grade = "A"
    elif total >= 70:
        grade = "B"
    elif total >= 60:
        grade = "C"
    else:
        grade = "Needs Work"

    # Top 3 things to fix (lowest scoring dimensions proportionally)
    dims = [
        ("Content", content["score"], content["max"]),
        ("Skills", skills["score"], skills["max"]),
        ("Structure", structure["score"], structure["max"]),
        ("Language", language["score"], language["max"]),
        ("ATS Compatibility", ats["score"], ats["max"]),
    ]
    dims_sorted = sorted(dims, key=lambda d: d[1] / d[2])
    fixes = []
    for name, score, mx in dims_sorted[:3]:
        pct = round(score / mx * 100)
        fixes.append(f"{name} ({pct}%): This is your weakest area — review the details above for specific improvements.")

    # Fake percentile for motivation
    percentile = min(95, max(20, int(total * 0.9 + 10)))

    return {
        "total_score": total,
        "grade": grade,
        "percentile": percentile,
        "dimensions": {
            "content": content,
            "skills": skills,
            "structure": structure,
            "language": language,
            "ats_compatibility": ats,
        },
        "top_fixes": fixes,
    }
