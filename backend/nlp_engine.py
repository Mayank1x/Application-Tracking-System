

import math
import re
import string
from collections import Counter, defaultdict
from typing import Dict, List, Set, Tuple

import nltk
import numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import sent_tokenize, word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# NLTK resource downloads (required corpora/models)
# ---------------------------------------------------------------------------
NLTK_RESOURCES = [
    "punkt",
    "punkt_tab",
    "stopwords",
    "wordnet",
    "omw-1.4",
    "averaged_perceptron_tagger_eng",
]
for resource in NLTK_RESOURCES:
    nltk.download(resource, quiet=True)

# ---------------------------------------------------------------------------
# Shared NLP objects
# ---------------------------------------------------------------------------
STOP_WORDS = set(stopwords.words("english"))
LEMMATIZER = WordNetLemmatizer()

# ---------------------------------------------------------------------------
# Skills dictionary — 6 categories
# ---------------------------------------------------------------------------
SKILLS_BY_CATEGORY: Dict[str, List[str]] = {
    "Programming Languages": [
        "Python", "Java", "C", "C++", "JavaScript", "TypeScript", "R",
        "MATLAB", "Scala", "Go", "Ruby", "Swift", "Kotlin", "PHP",
    ],
    "AI & Machine Learning": [
        "Machine Learning", "Deep Learning", "Natural Language Processing",
        "Computer Vision", "TensorFlow", "PyTorch", "Keras", "Scikit-learn",
        "OpenCV", "NLTK", "spaCy", "Pandas", "NumPy", "Matplotlib", "Seaborn",
    ],
    "Web Development": [
        "HTML", "CSS", "React", "Angular", "Vue", "Node.js", "Django",
        "Flask", "FastAPI", "REST API", "Bootstrap", "jQuery",
    ],
    "Database & Cloud": [
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Firebase", "AWS",
        "Azure", "Google Cloud", "Docker", "Kubernetes",
    ],
    "Data & BI Tools": [
        "Excel", "Power BI", "Tableau", "Jupyter", "Git", "GitHub", "Linux",
        "Jira", "Figma",
    ],
    "Soft Skills": [
        "Communication", "Leadership", "Teamwork", "Problem Solving",
        "Critical Thinking", "Time Management", "Adaptability", "Creativity",
    ],
}

# ---------------------------------------------------------------------------
# Action verbs for ATS analysis
# ---------------------------------------------------------------------------
ACTION_VERBS = {
    "achieved", "administered", "analyzed", "automated", "built", "collaborated",
    "conducted", "configured", "contributed", "coordinated", "created", "debugged",
    "delivered", "deployed", "designed", "developed", "directed", "documented",
    "engineered", "established", "evaluated", "executed", "facilitated",
    "generated", "identified", "implemented", "improved", "increased",
    "initiated", "integrated", "launched", "led", "maintained", "managed",
    "mentored", "migrated", "monitored", "negotiated", "optimized",
    "orchestrated", "organized", "performed", "planned", "presented",
    "programmed", "published", "reduced", "refactored", "researched",
    "resolved", "reviewed", "scaled", "secured", "simplified", "spearheaded",
    "streamlined", "supervised", "supported", "tested", "tracked", "trained",
    "transformed", "troubleshot", "upgraded", "utilized", "visualized", "wrote",
}

# ---------------------------------------------------------------------------
# Section headers expected in a professional resume
# ---------------------------------------------------------------------------
SECTION_HEADERS = {
    "contact": ["contact", "personal information", "personal details"],
    "summary": ["summary", "professional summary", "objective", "profile", "about me"],
    "education": ["education", "academic", "qualification", "academics"],
    "experience": ["experience", "work experience", "employment", "internship", "work history"],
    "projects": ["project", "projects", "academic projects", "personal projects"],
    "skills": ["skills", "technical skills", "competencies", "technologies"],
    "certifications": ["certification", "certifications", "courses", "training"],
    "achievements": ["achievements", "awards", "honors", "accomplishments"],
}


# ═══════════════════════════════════════════════════════════════════════════
# TEXT PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════════
def clean_text(raw_text: str) -> str:
    """Clean text using regex and normalization rules."""
    if not raw_text or not isinstance(raw_text, str):
        return ""
    text = raw_text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", " ", text)
    text = re.sub(r"\+?\d[\d\s\-\(\)]{8,}\d", " ", text)
    text = text.translate(str.maketrans({ch: " " for ch in string.punctuation}))
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def preprocess_tokens(cleaned_text: str) -> List[str]:
    """Convert cleaned text into normalized tokens."""
    if not cleaned_text:
        return []
    tokens = word_tokenize(cleaned_text)
    processed: List[str] = []
    for token in tokens:
        if token in STOP_WORDS or len(token) <= 1:
            continue
        if not re.match(r"^[a-z0-9]+$", token):
            continue
        lemma = LEMMATIZER.lemmatize(token)
        if len(lemma) > 1:
            processed.append(lemma)
    return processed


def preprocess_text_for_model(raw_text: str) -> str:
    """Full preprocessing: clean → tokenize → join for TF-IDF."""
    cleaned = clean_text(raw_text)
    tokens = preprocess_tokens(cleaned)
    return " ".join(tokens)


# ═══════════════════════════════════════════════════════════════════════════
# MODULE 1: RESUME vs JOB DESCRIPTION MATCHER
# ═══════════════════════════════════════════════════════════════════════════
def get_match_recommendation(score: float) -> str:
    """Map match percentage to qualitative recommendation label."""
    if score >= 75:
        return "Strong Match"
    if score >= 60:
        return "Good Match"
    if score >= 40:
        return "Needs Improvement"
    return "Poor Match"


def analyze_resume_job_match(resume_text: str, job_text: str) -> Dict:
    """
    Compare resume and job description with TF-IDF + cosine similarity.
    Returns score, matching/missing keywords, and recommendation.
    """
    try:
        resume_processed = preprocess_text_for_model(resume_text)
        job_processed = preprocess_text_for_model(job_text)

        if not resume_processed or not job_processed:
            raise ValueError("Please provide meaningful text in both fields.")

        vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([resume_processed, job_processed])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        score_percentage = float(np.clip(similarity * 100, 0, 100))

        resume_keywords = set(resume_processed.split())
        job_keywords = set(job_processed.split())
        matching_keywords = sorted(resume_keywords & job_keywords)
        missing_keywords = sorted(job_keywords - resume_keywords)

        # Prioritize missing keywords by TF-IDF weight
        feature_names = np.array(vectorizer.get_feature_names_out())
        job_vector = tfidf_matrix[1].toarray().flatten()
        top_indices = np.argsort(job_vector)[::-1]
        prioritized_missing = []
        for idx in top_indices:
            term = feature_names[idx]
            if term in missing_keywords and job_vector[idx] > 0:
                prioritized_missing.append(term)
            if len(prioritized_missing) >= 20:
                break

        return {
            "score": round(score_percentage, 2),
            "recommendation": get_match_recommendation(score_percentage),
            "matching_keywords": matching_keywords[:30],
            "missing_keywords": prioritized_missing or missing_keywords[:30],
        }
    except Exception as exc:
        raise RuntimeError(f"Matching error: {exc}") from exc


# ═══════════════════════════════════════════════════════════════════════════
# ATS SCORING (Professional-Grade)
# ═══════════════════════════════════════════════════════════════════════════
def _detect_contact_info(text: str) -> Dict[str, bool]:
    """Detect contact information elements in resume."""
    return {
        "email": bool(re.search(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", text)),
        "phone": bool(re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", text)),
        "linkedin": bool(re.search(r"linkedin\.com/in/[\w\-]+", text, re.IGNORECASE)),
        "github": bool(re.search(r"github\.com/[\w\-]+", text, re.IGNORECASE)),
        "portfolio": bool(re.search(r"(portfolio|website|blog)\s*[:\-]?\s*https?://", text, re.IGNORECASE)),
    }


def _detect_sections(text: str) -> Dict[str, bool]:
    """Detect resume sections present."""
    text_lower = text.lower()
    found = {}
    for section, keywords in SECTION_HEADERS.items():
        found[section] = any(kw in text_lower for kw in keywords)
    return found


def _detect_action_verbs(text: str) -> Dict:
    """Analyze use of action verbs in resume bullets."""
    lines = text.split("\n")
    bullet_lines = [l.strip() for l in lines if l.strip().startswith(("-", "•", "–", "*"))]
    total_bullets = len(bullet_lines)
    action_count = 0
    found_verbs = set()

    for line in bullet_lines:
        clean = re.sub(r"^[-•–*]\s*", "", line).strip()
        first_word = clean.split()[0].lower() if clean.split() else ""
        if first_word in ACTION_VERBS:
            action_count += 1
            found_verbs.add(first_word)

    return {
        "total_bullets": total_bullets,
        "action_verb_bullets": action_count,
        "action_verb_percentage": round((action_count / total_bullets * 100) if total_bullets > 0 else 0, 1),
        "verbs_found": sorted(found_verbs),
    }


def _detect_quantification(text: str) -> Dict:
    """Detect measurable achievements with numbers/percentages."""
    lines = text.split("\n")
    total_lines = len([l for l in lines if l.strip()])
    quant_patterns = [
        r"\d+\s*%",                    # percentages
        r"\$\s*[\d,]+",               # dollar amounts
        r"\d+\s*\+?\s*(users|clients|customers|projects|team)",  # scale
        r"(increased|decreased|improved|reduced|grew|saved)\s.*\d+",  # impact
        r"\d+x\b",                    # multipliers
    ]
    quant_lines = 0
    for line in lines:
        if any(re.search(p, line, re.IGNORECASE) for p in quant_patterns):
            quant_lines += 1

    return {
        "quantified_lines": quant_lines,
        "total_content_lines": total_lines,
        "quantification_percentage": round((quant_lines / total_lines * 100) if total_lines > 0 else 0, 1),
    }


def _check_resume_length(text: str) -> Dict:
    """Evaluate resume length appropriateness."""
    word_count = len(text.split())
    line_count = len([l for l in text.split("\n") if l.strip()])

    if word_count < 150:
        verdict = "Too Short"
        score = 40
    elif word_count < 300:
        verdict = "Short"
        score = 65
    elif word_count <= 800:
        verdict = "Optimal"
        score = 100
    elif word_count <= 1200:
        verdict = "Slightly Long"
        score = 80
    else:
        verdict = "Too Long"
        score = 55

    return {
        "word_count": word_count,
        "line_count": line_count,
        "verdict": verdict,
        "length_score": score,
    }


def flatten_skills(skill_data: Dict) -> Set[str]:
    """Flatten category-wise skill dictionary into a lowercase unique set."""
    flattened: Set[str] = set()
    by_category = skill_data.get("skills_by_category", {})
    for skills in by_category.values():
        for skill in skills:
            flattened.add(skill.lower())
    return flattened


def compute_ats_score(resume_text: str, job_text: str, match_score: float) -> Dict:
    """
    Compute comprehensive ATS readiness score.

    Sub-scores:
    - Match Component (30%): TF-IDF cosine similarity
    - Skill Coverage (25%): Skills from JD found in resume
    - Section Score (15%): Resume section completeness
    - Keyword Coverage (10%): Token-level JD coverage
    - Contact Info (5%): Completeness of contact details
    - Action Verbs (5%): Use of action verbs in bullets
    - Quantification (5%): Measurable achievements
    - Length Score (5%): Appropriate resume length
    """
    # Skill coverage
    resume_skill_data = extract_and_categorize_skills(resume_text)
    job_skill_data = extract_and_categorize_skills(job_text)
    resume_skills = flatten_skills(resume_skill_data)
    job_skills = flatten_skills(job_skill_data)
    skill_coverage = (len(resume_skills & job_skills) / len(job_skills) * 100) if job_skills else 0.0

    # Keyword coverage
    resume_tokens = set(preprocess_tokens(clean_text(resume_text)))
    job_tokens = set(preprocess_tokens(clean_text(job_text)))
    keyword_coverage = (len(resume_tokens & job_tokens) / len(job_tokens) * 100) if job_tokens else 0.0

    # Section completeness
    sections = _detect_sections(resume_text)
    detected_count = sum(sections.values())
    section_score = (detected_count / len(SECTION_HEADERS)) * 100

    # Contact info
    contact = _detect_contact_info(resume_text)
    contact_score = sum(contact.values()) / len(contact) * 100

    # Action verbs
    action_data = _detect_action_verbs(resume_text)
    action_score = min(action_data["action_verb_percentage"] * 1.5, 100)

    # Quantification
    quant_data = _detect_quantification(resume_text)
    quant_score = min(quant_data["quantification_percentage"] * 3, 100)

    # Length
    length_data = _check_resume_length(resume_text)
    length_score = length_data["length_score"]

    # Weighted composite
    ats_score = (
        0.30 * match_score
        + 0.25 * skill_coverage
        + 0.15 * section_score
        + 0.10 * keyword_coverage
        + 0.05 * contact_score
        + 0.05 * action_score
        + 0.05 * quant_score
        + 0.05 * length_score
    )
    final_score = float(np.clip(ats_score, 0, 100))

    # Recommendation
    if final_score >= 80:
        recommendation = "ATS Ready ✅"
    elif final_score >= 65:
        recommendation = "ATS Friendly 🟡"
    elif final_score >= 50:
        recommendation = "Needs Improvement ⚠️"
    else:
        recommendation = "ATS Risk 🔴"

    # Build improvement tips
    improvements = []
    if contact_score < 60:
        missing_contacts = [k for k, v in contact.items() if not v]
        improvements.append(f"Add missing contact info: {', '.join(missing_contacts)}")
    if section_score < 75:
        missing_sections = [k for k, v in sections.items() if not v]
        improvements.append(f"Add these resume sections: {', '.join(missing_sections)}")
    if action_data["action_verb_percentage"] < 50:
        improvements.append("Start more bullet points with action verbs (e.g., Developed, Designed, Implemented)")
    if quant_data["quantification_percentage"] < 10:
        improvements.append("Add measurable achievements with numbers and percentages")
    if length_data["verdict"] in ("Too Short", "Short"):
        improvements.append("Add more detail to experience and project descriptions")
    if length_data["verdict"] in ("Too Long",):
        improvements.append("Condense resume — aim for 300-800 words for best ATS parsing")
    if skill_coverage < 50:
        improvements.append("Add more skills from the job description to your resume")
    if keyword_coverage < 40:
        improvements.append("Incorporate more JD keywords naturally into your experience bullets")

    return {
        "ats_score": round(final_score, 2),
        "recommendation": recommendation,
        "breakdown": {
            "match_component": round(match_score, 2),
            "skill_coverage": round(skill_coverage, 2),
            "section_score": round(section_score, 2),
            "keyword_coverage": round(keyword_coverage, 2),
            "contact_info_score": round(contact_score, 2),
            "action_verb_score": round(action_score, 2),
            "quantification_score": round(quant_score, 2),
            "length_score": round(float(length_score), 2),
        },
        "details": {
            "contact_info": contact,
            "sections_found": sections,
            "action_verbs": action_data,
            "quantification": quant_data,
            "resume_length": length_data,
        },
        "improvements": improvements,
    }


# ═══════════════════════════════════════════════════════════════════════════
# ATS RESUME OPTIMIZER
# ═══════════════════════════════════════════════════════════════════════════
def build_ats_optimized_resume(
    resume_text: str, job_text: str, missing_keywords: List[str]
) -> Dict:
    """Create a JD-tailored resume draft using NLP sentence relevance."""
    sentences = [s.strip() for s in sent_tokenize(resume_text) if s.strip()]
    if not sentences:
        raise ValueError("Resume text is empty.")

    jd_processed = preprocess_text_for_model(job_text)
    if not jd_processed:
        raise ValueError("Job description is empty.")

    sentence_processed = [preprocess_text_for_model(s) or "placeholder" for s in sentences]
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(sentence_processed + [jd_processed])
    jd_vec = matrix[-1:]

    scores = cosine_similarity(matrix[:-1], jd_vec).flatten()
    top_indices = np.argsort(scores)[::-1][:6]
    selected = [sentences[i] for i in sorted(top_indices) if len(sentences[i]) > 20]

    resume_skills = flatten_skills(extract_and_categorize_skills(resume_text))
    missing_priority = [kw for kw in missing_keywords if len(kw.split()) <= 3][:12]

    core_skills = sorted({s.title() for s in resume_skills})[:14]
    for kw in missing_priority:
        if kw.lower() not in {s.lower() for s in core_skills}:
            core_skills.append(kw.title())
    core_skills = core_skills[:20]

    first_line = "Candidate Name"
    for line in resume_text.splitlines():
        if line.strip():
            first_line = line.strip()
            break

    summary_seed = selected[0] if selected else "Motivated candidate with relevant experience."
    role_tokens = list(dict.fromkeys(preprocess_tokens(clean_text(job_text))))[:6]
    role_focus = ", ".join(role_tokens[:4]) if role_tokens else "target role"

    draft = [
        first_line, "",
        "PROFESSIONAL SUMMARY",
        f"{summary_seed} Focused on {role_focus} with alignment to the target role.", "",
        "CORE SKILLS",
        ", ".join(core_skills) if core_skills else "Add role-specific skills here.", "",
        "TARGETED EXPERIENCE HIGHLIGHTS",
    ]
    for s in (selected or [])[:5]:
        draft.append(f"- {s.strip().lstrip('- ').rstrip('.')}.")
    draft.extend(["", "ATS KEYWORD BOOSTERS",
                   ", ".join(missing_priority) if missing_priority else "No major missing keywords."])

    suggestions = [
        "Add measurable impact in experience bullets (%, time saved, accuracy gain).",
        "Place top JD keywords naturally in Summary, Skills, and Project sections.",
        "Keep each bullet action-oriented: verb + task + tool + outcome.",
        "Ensure key JD skills appear in at least two resume sections.",
    ]

    return {
        "edited_resume": "\n".join(draft),
        "missing_keywords_used": missing_priority,
        "suggestions": suggestions,
    }


# ═══════════════════════════════════════════════════════════════════════════
# MODULE 2: SKILL EXTRACTOR & CATEGORIZER
# ═══════════════════════════════════════════════════════════════════════════
def build_skill_pattern(skill: str) -> str:
    """Build regex for robust skill matching with word boundaries."""
    escaped = re.escape(skill.lower()).replace(r"\ ", r"\s+")
    if skill[-1].isalpha() and not skill.lower().endswith("s"):
        return rf"\b{escaped}(?:s)?\b"
    return rf"(?<!\w){escaped}(?!\w)"


def extract_and_categorize_skills(resume_text: str) -> Dict:
    """Extract skills using dictionary + regex and group by category."""
    try:
        cleaned = clean_text(resume_text)
        if not cleaned:
            raise ValueError("Resume text is empty after preprocessing.")

        found_by_category: Dict[str, Set[str]] = defaultdict(set)
        for category, skills in SKILLS_BY_CATEGORY.items():
            for skill in skills:
                pattern = build_skill_pattern(skill)
                if re.search(pattern, cleaned, flags=re.IGNORECASE):
                    found_by_category[category].add(skill)

        normalized = {cat: sorted(skills) for cat, skills in found_by_category.items()}
        total = sum(len(s) for s in normalized.values())
        strong = [c for c, s in normalized.items() if len(s) >= 3]
        missing = [c for c in SKILLS_BY_CATEGORY if c not in normalized]

        in_demand = [
            "Python", "SQL", "Machine Learning", "Natural Language Processing",
            "Scikit-learn", "FastAPI", "Docker", "AWS", "Git", "Communication",
        ]
        all_found = {s for skills in normalized.values() for s in skills}
        suggested = [s for s in in_demand if s not in all_found]

        return {
            "total_skills": total,
            "skills_by_category": normalized,
            "strong_categories": strong,
            "missing_categories": missing,
            "suggested_skills": suggested,
        }
    except Exception as exc:
        raise RuntimeError(f"Skill extraction error: {exc}") from exc


# ═══════════════════════════════════════════════════════════════════════════
# MODULE 3: RESUME SUMMARIZER (Extractive)
# ═══════════════════════════════════════════════════════════════════════════
def tokenize_sentence_for_scoring(sentence: str) -> List[str]:
    """Tokenize and normalize sentence words for scoring."""
    cleaned = clean_text(sentence)
    tokens = word_tokenize(cleaned)
    return [
        LEMMATIZER.lemmatize(t) for t in tokens
        if t not in STOP_WORDS and len(t) > 1 and t.isalnum()
    ]


def build_global_tfidf_weights(sentences: List[str]) -> Dict[str, float]:
    """Compute TF-IDF weight for each word across all sentences."""
    tokenized = [tokenize_sentence_for_scoring(s) for s in sentences]
    all_tokens = [t for sent in tokenized for t in sent]
    if not all_tokens:
        return {}

    total = len(all_tokens)
    tf_counts = Counter(all_tokens)
    df_counts = Counter()
    for sent_tokens in tokenized:
        for term in set(sent_tokens):
            df_counts[term] += 1

    n = max(len(sentences), 1)
    return {
        term: (count / total) * (math.log((n + 1) / (df_counts[term] + 1)) + 1)
        for term, count in tf_counts.items()
    }


def generate_resume_summary(resume_text: str) -> Dict:
    """Generate extractive summary using TF-IDF sentence scoring."""
    try:
        sentences = [s.strip() for s in sent_tokenize(resume_text) if s.strip()]
        if len(sentences) < 2:
            raise ValueError("Provide a longer resume with multiple sentences.")

        weights = build_global_tfidf_weights(sentences)
        if not weights:
            raise ValueError("Unable to compute sentence scores.")

        scored: List[Tuple[int, str, float]] = []
        for idx, sent in enumerate(sentences):
            tokens = tokenize_sentence_for_scoring(sent)
            if not tokens:
                continue
            raw = sum(weights.get(t, 0.0) for t in tokens)
            scored.append((idx, sent, raw / len(tokens)))

        if not scored:
            raise ValueError("No valid sentence scores were generated.")

        if len(sentences) <= 8:
            n = min(5, len(sentences))
        elif len(sentences) <= 14:
            n = min(6, len(sentences))
        else:
            n = min(7, len(sentences))

        top = sorted(scored, key=lambda x: x[2], reverse=True)[:n]
        ordered = sorted(top, key=lambda x: x[0])
        summary = " ".join(item[1] for item in ordered)

        orig_wc = len(word_tokenize(clean_text(resume_text)))
        summ_wc = len(word_tokenize(clean_text(summary)))
        ratio = (summ_wc / orig_wc * 100) if orig_wc > 0 else 0

        return {
            "summary": summary,
            "original_word_count": orig_wc,
            "summary_word_count": summ_wc,
            "compression_ratio": round(ratio, 2),
            "selected_sentence_count": len(ordered),
        }
    except Exception as exc:
        raise RuntimeError(f"Summarization error: {exc}") from exc
