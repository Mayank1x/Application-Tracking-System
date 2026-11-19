import math
import re
import string
from collections import Counter, defaultdict
from typing import Dict, List, Set, Tuple

import nltk
import numpy as np
import pandas as pd
import streamlit as st
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import sent_tokenize, word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity



NLTK_RESOURCES = [
    "punkt",
    "stopwords",
    "wordnet",
    "omw-1.4",
]
for resource in NLTK_RESOURCES:
    nltk.download(resource, quiet=True)


# -----------------------------------------------------------------------------
# UI constants: color style and sample inputs
# -----------------------------------------------------------------------------
APP_TITLE = "Intelligent Resume Analyzer using NLP"
PRIMARY_BLUE = "#0F4C81"
LIGHT_BLUE = "#EAF3FF"

SAMPLE_RESUME = """
Aarav Sharma
Bhopal, India | aarav.sharma@email.com | +91-9876543210

SUMMARY
Motivated Computer Science undergraduate at VIT Bhopal with strong interest in Natural Language Processing, Machine Learning, and Data Analytics. Hands-on experience with Python, Scikit-learn, and Streamlit for building end-to-end data applications.

EDUCATION
B.Tech in Computer Science Engineering, VIT Bhopal University (2023-2027)
CGPA: 8.62/10

TECHNICAL SKILLS
Programming: Python, Java, C++, JavaScript, SQL
AI/ML: Machine Learning, Deep Learning, Natural Language Processing, TensorFlow, Keras, Scikit-learn, NLTK, Pandas, NumPy, Matplotlib
Web: HTML, CSS, React, Flask, FastAPI, REST API
Tools: Git, GitHub, Linux, Jupyter, Power BI
Cloud & Database: MySQL, MongoDB, AWS, Docker

PROJECTS
1. Fake News Detection using NLP
- Built a text classification pipeline using TF-IDF and Logistic Regression.
- Performed cleaning, tokenization, stopword removal, and lemmatization.

2. Student Performance Predictor
- Developed a regression model for score prediction using Python and Scikit-learn.
- Visualized trends using Matplotlib and Seaborn.

EXPERIENCE
Data Science Intern, ABC Analytics (May 2025 - July 2025)
- Worked on data preprocessing and dashboarding in Power BI.
- Collaborated with cross-functional teams and improved reporting speed by 20%.

SOFT SKILLS
Communication, Leadership, Teamwork, Problem Solving, Critical Thinking, Adaptability
""".strip()

SAMPLE_JOB_DESCRIPTION = """
We are hiring an NLP/ML Engineer Intern.

Responsibilities:
- Build and optimize NLP pipelines for text analytics tasks.
- Work with Python, Scikit-learn, and NLTK for feature engineering.
- Develop APIs using FastAPI or Flask.
- Collaborate with product and engineering teams.

Required Skills:
Python, Machine Learning, Natural Language Processing, Scikit-learn, NLTK,
Pandas, NumPy, FastAPI, REST API, Git, SQL, Docker, AWS, Communication,
Teamwork, Problem Solving.
""".strip()


# -----------------------------------------------------------------------------
# Skills dictionary for module 2 (exact categories required in prompt)
# -----------------------------------------------------------------------------
SKILLS_BY_CATEGORY: Dict[str, List[str]] = {
    "Programming Languages": [
        "Python", "Java", "C", "C++", "JavaScript", "TypeScript", "R",
        "MATLAB", "Scala", "Go", "Ruby", "Swift", "Kotlin", "PHP"
    ],
    "AI & Machine Learning": [
        "Machine Learning", "Deep Learning", "Natural Language Processing",
        "Computer Vision", "TensorFlow", "PyTorch", "Keras", "Scikit-learn",
        "OpenCV", "NLTK", "spaCy", "Pandas", "NumPy", "Matplotlib", "Seaborn"
    ],
    "Web Development": [
        "HTML", "CSS", "React", "Angular", "Vue", "Node.js", "Django",
        "Flask", "FastAPI", "REST API", "Bootstrap", "jQuery"
    ],
    "Database & Cloud": [
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Firebase", "AWS",
        "Azure", "Google Cloud", "Docker", "Kubernetes"
    ],
    "Data & BI Tools": [
        "Excel", "Power BI", "Tableau", "Jupyter", "Git", "GitHub", "Linux",
        "Jira", "Figma"
    ],
    "Soft Skills": [
        "Communication", "Leadership", "Teamwork", "Problem Solving",
        "Critical Thinking", "Time Management", "Adaptability", "Creativity"
    ]
}


# -----------------------------------------------------------------------------
# Shared NLP helper objects
# -----------------------------------------------------------------------------
STOP_WORDS = set(stopwords.words("english"))
LEMMATIZER = WordNetLemmatizer()


# -----------------------------------------------------------------------------
# Core text preprocessing helpers
# -----------------------------------------------------------------------------
def clean_text(raw_text: str) -> str:
    """
    Clean text using regex and normalization rules.

    Steps:
    1) Lowercase conversion
    2) Remove URLs, emails, and phone numbers
    3) Remove punctuation/special characters
    4) Collapse extra whitespace/newlines
    """
    # Defensive guard for None/empty input
    if not raw_text or not isinstance(raw_text, str):
        return ""

    text = raw_text.lower()

    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # Remove email addresses
    text = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", " ", text)

    # Remove phone numbers (generic patterns for international/local formats)
    text = re.sub(r"\+?\d[\d\s\-\(\)]{8,}\d", " ", text)

    # Replace punctuation/special chars with space while keeping word boundaries
    text = text.translate(str.maketrans({ch: " " for ch in string.punctuation}))
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Remove extra spaces and newlines
    text = re.sub(r"\s+", " ", text).strip()

    return text


def preprocess_tokens(cleaned_text: str) -> List[str]:
    """
    Convert cleaned text into normalized tokens.

    Steps:
    1) Tokenize with NLTK word_tokenize
    2) Remove stopwords
    3) Lemmatize words
    4) Remove single-character tokens and non-alphanumeric remnants
    """
    if not cleaned_text:
        return []

    tokens = word_tokenize(cleaned_text)

    processed: List[str] = []
    for token in tokens:
        # Keep only useful tokens
        if token in STOP_WORDS:
            continue
        if len(token) <= 1:
            continue
        if not re.match(r"^[a-z0-9]+$", token):
            continue

        lemma = LEMMATIZER.lemmatize(token)
        if len(lemma) > 1:
            processed.append(lemma)

    return processed


def preprocess_text_for_model(raw_text: str) -> str:
    """
    Full preprocessing wrapper returning a space-joined token string.

    This representation is ideal for TF-IDF vectorization.
    """
    cleaned = clean_text(raw_text)
    tokens = preprocess_tokens(cleaned)
    return " ".join(tokens)


# -----------------------------------------------------------------------------
# Module 1: Resume vs Job Description Matcher
# -----------------------------------------------------------------------------
def get_match_recommendation(score: float) -> str:
    """Map match percentage to qualitative recommendation label."""
    if score >= 75:
        return "Strong Match"
    if score >= 60:
        return "Good Match"
    if score >= 40:
        return "Needs Improvement"
    return "Poor Match"


def analyze_resume_job_match(resume_text: str, job_text: str) -> Dict[str, object]:
    """
    Compare resume and job description with TF-IDF + cosine similarity.

    Returns a dictionary containing:
    - score percentage
    - matching keywords
    - missing job keywords
    - recommendation label
    """
    try:
        # Preprocess both documents with shared NLP pipeline
        resume_processed = preprocess_text_for_model(resume_text)
        job_processed = preprocess_text_for_model(job_text)

        if not resume_processed or not job_processed:
            raise ValueError("Please provide meaningful text in both fields.")

        # TF-IDF feature extraction using required configuration
        vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([resume_processed, job_processed])

        # Cosine similarity score between resume vector and JD vector
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        score_percentage = float(np.clip(similarity * 100, 0, 100))

        # Keyword analysis: find overlap and gaps using token sets
        resume_keywords = set(resume_processed.split())
        job_keywords = set(job_processed.split())

        matching_keywords = sorted(list(resume_keywords.intersection(job_keywords)))
        missing_keywords = sorted(list(job_keywords.difference(resume_keywords)))

        # Highlight top missing terms by TF-IDF weight in job description
        feature_names = np.array(vectorizer.get_feature_names_out())
        job_vector_dense = tfidf_matrix[1].toarray().flatten()
        top_jd_indices = np.argsort(job_vector_dense)[::-1]

        prioritized_missing = []
        for idx in top_jd_indices:
            term = feature_names[idx]
            if term in missing_keywords and job_vector_dense[idx] > 0:
                prioritized_missing.append(term)
            if len(prioritized_missing) >= 20:
                break

        return {
            "score": round(score_percentage, 2),
            "recommendation": get_match_recommendation(score_percentage),
            "matching_keywords": matching_keywords[:30],
            "missing_keywords": prioritized_missing if prioritized_missing else missing_keywords[:30],
        }

    except Exception as exc:
        raise RuntimeError(f"Error in matching module: {exc}") from exc


def get_ats_recommendation(score: float) -> str:
    """Map ATS score to an easy-to-understand readiness label."""
    if score >= 80:
        return "ATS Ready"
    if score >= 65:
        return "ATS Friendly"
    if score >= 50:
        return "ATS Needs Improvement"
    return "ATS Risk"


def flatten_skills(skill_data: Dict[str, object]) -> Set[str]:
    """Flatten category-wise skill dictionary into a lowercase unique set."""
    flattened: Set[str] = set()
    by_category = skill_data.get("skills_by_category", {})
    for skills in by_category.values():
        for skill in skills:
            flattened.add(skill.lower())
    return flattened


def compute_ats_score(resume_text: str, job_text: str, match_score: float) -> Dict[str, object]:
    """
    Compute ATS readiness score using interpretable weighted sub-scores.

    Components:
    - Match score (resume vs JD cosine score)
    - Skill coverage for JD skills
    - Section completeness in resume
    - Keyword coverage for JD tokens
    - Basic formatting readiness checks
    """
    # Skill coverage based on dictionary extraction
    resume_skill_data = extract_and_categorize_skills(resume_text)
    job_skill_data = extract_and_categorize_skills(job_text)

    resume_skills = flatten_skills(resume_skill_data)
    job_skills = flatten_skills(job_skill_data)

    if job_skills:
        skill_coverage = (len(resume_skills.intersection(job_skills)) / len(job_skills)) * 100
    else:
        skill_coverage = 0.0

    # Keyword coverage using normalized token overlap
    resume_tokens = set(preprocess_tokens(clean_text(resume_text)))
    job_tokens = set(preprocess_tokens(clean_text(job_text)))
    if job_tokens:
        keyword_coverage = (len(resume_tokens.intersection(job_tokens)) / len(job_tokens)) * 100
    else:
        keyword_coverage = 0.0

    # Section completeness: basic ATS-friendly resume structure checks
    section_markers = {
        "summary": ["summary", "professional summary", "objective"],
        "education": ["education", "academic"],
        "experience": ["experience", "internship", "work history"],
        "projects": ["project", "projects"],
        "skills": ["skills", "technical skills"],
    }
    resume_lower = resume_text.lower()
    detected_sections = 0
    for variants in section_markers.values():
        if any(marker in resume_lower for marker in variants):
            detected_sections += 1
    section_score = (detected_sections / len(section_markers)) * 100

    # Formatting readiness checks (simple and explainable)
    formatting_score = 100.0
    if len(resume_text.splitlines()) < 8:
        formatting_score -= 20
    if len(resume_text) > 7000:
        formatting_score -= 10
    if not re.search(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", resume_text):
        formatting_score -= 5
    if not re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", resume_text):
        formatting_score -= 5
    formatting_score = float(np.clip(formatting_score, 0, 100))

    # Weighted ATS composite score
    ats_score = (
        (0.50 * match_score)
        + (0.20 * skill_coverage)
        + (0.15 * section_score)
        + (0.10 * keyword_coverage)
        + (0.05 * formatting_score)
    )

    final_score = float(np.clip(ats_score, 0, 100))
    return {
        "ats_score": round(final_score, 2),
        "recommendation": get_ats_recommendation(final_score),
        "breakdown": {
            "match_component": round(match_score, 2),
            "skill_coverage": round(skill_coverage, 2),
            "section_score": round(section_score, 2),
            "keyword_coverage": round(keyword_coverage, 2),
            "formatting_score": round(formatting_score, 2),
        },
    }


def build_ats_optimized_resume(resume_text: str, job_text: str, missing_keywords: List[str]) -> Dict[str, object]:
    """
    Create a JD-tailored resume draft using sentence relevance + missing keyword guidance.

    This is a classical NLP rewrite helper (no LLM calls):
    - Prioritizes resume sentences most relevant to JD via TF-IDF similarity.
    - Injects missing JD terms into an ATS keyword booster section.
    - Produces a cleaner structured draft for user editing.
    """
    sentences = [s.strip() for s in sent_tokenize(resume_text) if s.strip()]
    if not sentences:
        raise ValueError("Resume text is empty. Please paste resume content first.")

    jd_processed = preprocess_text_for_model(job_text)
    if not jd_processed:
        raise ValueError("Job description is empty. Please add or upload JD text.")

    sentence_processed = [preprocess_text_for_model(s) or "placeholder" for s in sentences]
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(sentence_processed + [jd_processed])
    jd_vec = matrix[-1:]

    sentence_scores = cosine_similarity(matrix[:-1], jd_vec).flatten()
    top_indices = np.argsort(sentence_scores)[::-1][:6]

    selected_sentences = [sentences[idx] for idx in sorted(top_indices)]
    selected_sentences = [s for s in selected_sentences if len(s) > 20]

    # Capture existing + target skills for a practical core-skills block
    resume_skills = flatten_skills(extract_and_categorize_skills(resume_text))
    missing_priority = [kw for kw in missing_keywords if len(kw.split()) <= 3][:12]

    core_skills: List[str] = sorted({skill.title() for skill in resume_skills})[:14]
    for kw in missing_priority:
        if kw.lower() not in {s.lower() for s in core_skills}:
            core_skills.append(kw.title())
    core_skills = core_skills[:20]

    # Pull first non-empty line as candidate header placeholder
    first_line = "Candidate Name"
    for line in resume_text.splitlines():
        if line.strip():
            first_line = line.strip()
            break

    summary_seed = selected_sentences[0] if selected_sentences else "Motivated candidate with relevant technical and professional experience."
    role_tokens = list(dict.fromkeys(preprocess_tokens(clean_text(job_text))))[:6]
    role_focus = ", ".join(role_tokens[:4]) if role_tokens else "target role requirements"

    draft_lines = [
        first_line,
        "",
        "PROFESSIONAL SUMMARY",
        f"{summary_seed} Focused on {role_focus} with alignment to the target job description.",
        "",
        "CORE SKILLS",
        ", ".join(core_skills) if core_skills else "Add role-specific technical skills here.",
        "",
        "TARGETED EXPERIENCE HIGHLIGHTS",
    ]

    if selected_sentences:
        for sentence in selected_sentences[:5]:
            cleaned_sentence = sentence.strip().lstrip("- ").rstrip(".")
            draft_lines.append(f"- {cleaned_sentence}.")
    else:
        draft_lines.append("- Add 3-5 quantified bullets aligned to the target role.")

    draft_lines.extend([
        "",
        "ATS KEYWORD BOOSTERS",
        ", ".join(missing_priority) if missing_priority else "No major missing keywords detected.",
    ])

    suggestions = [
        "Add measurable impact in experience bullets (for example, %, time saved, accuracy gain).",
        "Place top JD keywords naturally in Summary, Skills, and Project bullets.",
        "Keep each bullet action-oriented: verb + task + tool + outcome.",
        "Ensure important skills from JD appear in at least two resume sections.",
    ]

    return {
        "edited_resume": "\n".join(draft_lines),
        "missing_keywords_used": missing_priority,
        "suggestions": suggestions,
    }


def read_uploaded_text(uploaded_file) -> str:
    """Read uploaded .txt file safely and return decoded string."""
    if uploaded_file is None:
        return ""

    raw_bytes = uploaded_file.getvalue()
    if not raw_bytes:
        return ""

    try:
        return raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return raw_bytes.decode("latin-1", errors="ignore")


# -----------------------------------------------------------------------------
# Module 2: Skill Extractor and Categorizer
# -----------------------------------------------------------------------------
def build_skill_pattern(skill: str) -> str:
    """
    Build regex pattern for robust skill matching.

    Design choices:
    - Uses word boundaries for exact keyword detection.
    - Supports flexible whitespace in multi-word skills.
    - Supports basic singular/plural variation by optional trailing 's'.
    """
    # Escape regex meta chars safely, then replace escaped spaces with \s+
    escaped = re.escape(skill.lower())
    escaped = escaped.replace(r"\ ", r"\s+")

    # For alphabetic skills, allow simple plural variant (e.g., framework/frameworks)
    if skill[-1].isalpha() and not skill.lower().endswith("s"):
        return rf"\b{escaped}(?:s)?\b"

    # For terms like "c++" / "node.js", keep strict boundary-ish checks
    return rf"(?<!\w){escaped}(?!\w)"


def extract_and_categorize_skills(resume_text: str) -> Dict[str, object]:
    """
    Extract skills using dictionary + regex matching and group by category.

    Returns:
    - total skill count
    - detected skills by category
    - strong categories
    - missing categories
    """
    try:
        cleaned = clean_text(resume_text)
        if not cleaned:
            raise ValueError("Resume text is empty after preprocessing.")

        found_by_category: Dict[str, Set[str]] = defaultdict(set)

        # Iterate each category and skill list, match using case-insensitive regex
        for category, skills in SKILLS_BY_CATEGORY.items():
            for skill in skills:
                pattern = build_skill_pattern(skill)
                if re.search(pattern, cleaned, flags=re.IGNORECASE):
                    found_by_category[category].add(skill)

        # Convert sets to sorted lists for stable display
        normalized_found = {
            category: sorted(list(skills)) for category, skills in found_by_category.items()
        }

        total_skills = sum(len(skill_list) for skill_list in normalized_found.values())

        # Define strong categories as categories with at least 3 detected skills
        strong_categories = [cat for cat, skills in normalized_found.items() if len(skills) >= 3]

        # Missing categories are those with zero extracted skills
        missing_categories = [
            cat for cat in SKILLS_BY_CATEGORY.keys() if cat not in normalized_found
        ]

        # Create recommendation list from commonly in-demand skills not found
        in_demand_skills = [
            "Python", "SQL", "Machine Learning", "Natural Language Processing",
            "Scikit-learn", "FastAPI", "Docker", "AWS", "Git", "Communication"
        ]
        all_found_flat = {s for skills in normalized_found.values() for s in skills}
        suggested_skills = [skill for skill in in_demand_skills if skill not in all_found_flat]

        return {
            "total_skills": total_skills,
            "skills_by_category": normalized_found,
            "strong_categories": strong_categories,
            "missing_categories": missing_categories,
            "suggested_skills": suggested_skills,
        }

    except Exception as exc:
        raise RuntimeError(f"Error in skill extraction module: {exc}") from exc


# -----------------------------------------------------------------------------
# Module 3: Resume Summarizer (extractive)
# -----------------------------------------------------------------------------
def tokenize_sentence_for_scoring(sentence: str) -> List[str]:
    """Tokenize and normalize sentence words for TF-IDF style scoring."""
    cleaned = clean_text(sentence)
    tokens = word_tokenize(cleaned)

    valid_tokens = []
    for token in tokens:
        if token in STOP_WORDS:
            continue
        if len(token) <= 1:
            continue
        if not token.isalnum():
            continue
        valid_tokens.append(LEMMATIZER.lemmatize(token))

    return valid_tokens


def build_global_tfidf_weights(sentences: List[str]) -> Dict[str, float]:
    """
    Compute global TF-IDF-inspired weight for each word in resume text.

    Word weight = TF_global(word) * IDF(word across sentences)
    where:
    - TF_global(word) = count(word) / total_terms
    - IDF(word) = log((N + 1) / (df + 1)) + 1
    """
    tokenized_sentences = [tokenize_sentence_for_scoring(s) for s in sentences]

    # Flatten tokens for global term frequency
    all_tokens = [token for sent in tokenized_sentences for token in sent]
    if not all_tokens:
        return {}

    total_terms = len(all_tokens)
    tf_counts = Counter(all_tokens)

    # Document frequency: in how many sentences a term appears
    df_counts = Counter()
    for sent_tokens in tokenized_sentences:
        for term in set(sent_tokens):
            df_counts[term] += 1

    n_sentences = max(len(sentences), 1)

    # Compute weights dictionary
    weights = {}
    for term, tf_count in tf_counts.items():
        tf = tf_count / total_terms
        idf = math.log((n_sentences + 1) / (df_counts[term] + 1)) + 1
        weights[term] = tf * idf

    return weights


def generate_resume_summary(resume_text: str) -> Dict[str, object]:
    """
    Generate extractive summary using sentence scoring with TF-IDF weights.

    Steps:
    1) Sentence split
    2) Compute word weights
    3) Score each sentence by average weighted word score
    4) Select top 5-7 by score and restore original order
    5) Build final paragraph and stats
    """
    try:
        # Keep original sentence boundaries for readable summary output
        sentences = [s.strip() for s in sent_tokenize(resume_text) if s.strip()]
        if len(sentences) < 2:
            raise ValueError("Please provide a longer resume text with multiple sentences.")

        word_weights = build_global_tfidf_weights(sentences)
        if not word_weights:
            raise ValueError("Unable to compute sentence scores from the provided text.")

        scored_sentences: List[Tuple[int, str, float]] = []

        # Score each sentence by normalized sum of token weights
        for idx, sentence in enumerate(sentences):
            tokens = tokenize_sentence_for_scoring(sentence)
            if not tokens:
                continue

            raw_score = sum(word_weights.get(token, 0.0) for token in tokens)
            normalized_score = raw_score / len(tokens)
            scored_sentences.append((idx, sentence, normalized_score))

        if not scored_sentences:
            raise ValueError("No valid sentence scores were generated.")

        # Select summary size between 5 and 7 based on document length
        if len(sentences) <= 8:
            summary_size = min(5, len(sentences))
        elif len(sentences) <= 14:
            summary_size = min(6, len(sentences))
        else:
            summary_size = min(7, len(sentences))

        # Pick top scored sentences
        top_ranked = sorted(scored_sentences, key=lambda x: x[2], reverse=True)[:summary_size]

        # Reorder by original position to preserve coherence/flow
        selected_ordered = sorted(top_ranked, key=lambda x: x[0])
        summary_sentences = [item[1] for item in selected_ordered]

        summary_text = " ".join(summary_sentences)

        # Word count and compression ratio statistics
        original_word_count = len(word_tokenize(clean_text(resume_text)))
        summary_word_count = len(word_tokenize(clean_text(summary_text)))

        compression_ratio = 0.0
        if original_word_count > 0:
            compression_ratio = (summary_word_count / original_word_count) * 100

        return {
            "summary": summary_text,
            "original_word_count": original_word_count,
            "summary_word_count": summary_word_count,
            "compression_ratio": round(compression_ratio, 2),
            "selected_sentence_count": len(summary_sentences),
        }

    except Exception as exc:
        raise RuntimeError(f"Error in summarization module: {exc}") from exc


# -----------------------------------------------------------------------------
# Streamlit page render helpers
# -----------------------------------------------------------------------------
def apply_custom_style() -> None:
    """Inject a blue-white professional visual theme via custom CSS."""
    st.markdown(
        f"""
        <style>
            .stApp {{
                background: linear-gradient(180deg, #ffffff 0%, {LIGHT_BLUE} 100%);
            }}
            .main-title {{
                color: {PRIMARY_BLUE};
                font-size: 2rem;
                font-weight: 800;
                letter-spacing: 0.3px;
            }}
            .sub-title {{
                color: #143D66;
                font-size: 1.05rem;
                margin-bottom: 0.8rem;
            }}
            .section-card {{
                background: #ffffff;
                padding: 1rem;
                border-radius: 12px;
                border: 1px solid #d9e8fb;
            }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def show_home_page() -> None:
    """Render project overview page."""
    st.markdown(f"<div class='main-title'>{APP_TITLE}</div>", unsafe_allow_html=True)
    st.markdown(
        "<div class='sub-title'>CSA4028 - Natural Language Processing | VIT Bhopal</div>",
        unsafe_allow_html=True,
    )

    st.write(
        "This mini project demonstrates how classical NLP techniques can automate resume analysis "
        "through three practical modules without using any LLM APIs."
    )

    st.markdown("### Modules Included")
    st.info("1) Resume vs Job Description Matcher + ATS Score + Resume Optimizer")
    st.info("2) Skill Extractor & Categorizer (Regex + Dictionary-based NLP)")
    st.info("3) Resume Summarizer (Extractive sentence scoring)")

    st.markdown("### Why This Project Matters")
    st.write(
        "Manual screening of resumes is slow and inconsistent. The proposed system provides "
        "interpretable, reproducible, and beginner-friendly NLP workflows for educational use."
    )


def show_matcher_page() -> None:
    """Render module 1 UI and actions."""
    st.markdown("## Module 1: Resume vs Job Description Matcher")
    st.write(
        "This module computes how strongly a resume aligns with a target job description "
        "using TF-IDF feature vectors and cosine similarity, then estimates ATS readiness."
    )

    # Initialize state keys once for stable user editing and autofill behavior
    if "resume_input_mod1" not in st.session_state:
        st.session_state["resume_input_mod1"] = ""
    if "job_input_mod1" not in st.session_state:
        st.session_state["job_input_mod1"] = ""

    col_a, col_b = st.columns(2)
    with col_a:
        if st.button("Load Example Resume", key="btn_example_resume_m1"):
            st.session_state["resume_input_mod1"] = SAMPLE_RESUME
    with col_b:
        if st.button("Load Example Job Description", key="btn_example_jd_m1"):
            st.session_state["job_input_mod1"] = SAMPLE_JOB_DESCRIPTION

    upload_col_a, upload_col_b = st.columns(2)
    with upload_col_a:
        resume_upload = st.file_uploader(
            "Upload Resume Text (.txt)",
            type=["txt"],
            key="resume_upload_mod1",
        )
        if resume_upload is not None and st.button("Use Uploaded Resume", key="use_uploaded_resume_m1"):
            uploaded_resume_text = read_uploaded_text(resume_upload)
            if uploaded_resume_text.strip():
                st.session_state["resume_input_mod1"] = uploaded_resume_text
                st.success("Uploaded resume text loaded.")
            else:
                st.warning("Uploaded resume file is empty.")

    with upload_col_b:
        jd_upload = st.file_uploader(
            "Upload Job Description Text (.txt)",
            type=["txt"],
            key="jd_upload_mod1",
        )
        if jd_upload is not None and st.button("Use Uploaded JD", key="use_uploaded_jd_m1"):
            uploaded_jd_text = read_uploaded_text(jd_upload)
            if uploaded_jd_text.strip():
                st.session_state["job_input_mod1"] = uploaded_jd_text
                st.success("Uploaded JD text loaded.")
            else:
                st.warning("Uploaded JD file is empty.")

    resume_text = st.text_area(
        "Paste Resume Text",
        height=230,
        key="resume_input_mod1",
        placeholder="Enter resume text here...",
    )
    job_text = st.text_area(
        "Paste Job Description Text",
        height=210,
        key="job_input_mod1",
        placeholder="Enter job description text here...",
    )

    if st.button("Analyze Resume-Job Match", type="primary"):
        try:
            result = analyze_resume_job_match(resume_text, job_text)
            ats_result = compute_ats_score(resume_text, job_text, result["score"])

            metric_col_1, metric_col_2 = st.columns(2)
            metric_col_1.metric("Resume-JD Match", f"{result['score']}%")
            metric_col_2.metric("ATS Score", f"{ats_result['ats_score']}%")

            st.progress(min(int(result["score"]), 100))
            st.caption("Progress bar shows Resume-JD match score.")

            recommendation = result["recommendation"]
            if recommendation == "Strong Match":
                st.success(f"Recommendation: {recommendation}")
            elif recommendation == "Good Match":
                st.success(f"Recommendation: {recommendation}")
            elif recommendation == "Needs Improvement":
                st.warning(f"Recommendation: {recommendation}")
            else:
                st.error(f"Recommendation: {recommendation}")

            with st.expander("Matching Keywords"):
                st.write(", ".join(result["matching_keywords"]) if result["matching_keywords"] else "No overlap found.")

            with st.expander("Important Missing Keywords from Job Description"):
                st.write(", ".join(result["missing_keywords"]) if result["missing_keywords"] else "No major missing keywords found.")

            ats_label = ats_result["recommendation"]
            if ats_label in {"ATS Ready", "ATS Friendly"}:
                st.success(f"ATS Recommendation: {ats_label}")
            elif ats_label == "ATS Needs Improvement":
                st.warning(f"ATS Recommendation: {ats_label}")
            else:
                st.error(f"ATS Recommendation: {ats_label}")

            with st.expander("ATS Score Breakdown"):
                breakdown = ats_result["breakdown"]
                st.dataframe(
                    pd.DataFrame(
                        [
                            {"Metric": "Match Component", "Value": breakdown["match_component"]},
                            {"Metric": "Skill Coverage", "Value": breakdown["skill_coverage"]},
                            {"Metric": "Section Score", "Value": breakdown["section_score"]},
                            {"Metric": "Keyword Coverage", "Value": breakdown["keyword_coverage"]},
                            {"Metric": "Formatting Score", "Value": breakdown["formatting_score"]},
                        ]
                    ),
                    use_container_width=True,
                )

        except Exception as exc:
            st.error(str(exc))

    st.markdown("### ATS Resume Optimizer (Tailor Resume to Uploaded JD)")
    st.write(
        "Generate an ATS-friendly resume draft aligned to the given job description using "
        "classical NLP sentence relevance and missing-keyword guidance."
    )

    if st.button("Generate ATS-Optimized Resume Draft"):
        try:
            result = analyze_resume_job_match(resume_text, job_text)
            optimized = build_ats_optimized_resume(resume_text, job_text, result["missing_keywords"])

            st.success("ATS-tailored draft generated. Review and edit before final submission.")
            st.text_area(
                "Edited Resume Draft",
                value=optimized["edited_resume"],
                height=360,
                key="optimized_resume_output_mod1",
            )

            st.download_button(
                "Download Edited Resume (.txt)",
                data=optimized["edited_resume"],
                file_name="ats_optimized_resume.txt",
                mime="text/plain",
            )

            with st.expander("Edit Suggestions"):
                for suggestion in optimized["suggestions"]:
                    st.write(f"- {suggestion}")

            with st.expander("JD Keywords Added as Boosters"):
                st.write(
                    ", ".join(optimized["missing_keywords_used"])
                    if optimized["missing_keywords_used"]
                    else "No additional JD keywords were required."
                )

        except Exception as exc:
            st.error(str(exc))


def show_skill_extractor_page() -> None:
    """Render module 2 UI and actions."""
    st.markdown("## Module 2: Skill Extractor & Categorizer")
    st.write(
        "This module identifies skills in a resume using category dictionaries and "
        "word-boundary aware regex matching."
    )

    if "resume_input_mod2" not in st.session_state:
        st.session_state["resume_input_mod2"] = ""

    if st.button("Load Example Resume", key="btn_example_resume_m2"):
        st.session_state["resume_input_mod2"] = SAMPLE_RESUME

    resume_text = st.text_area(
        "Paste Resume Text for Skill Extraction",
        height=280,
        key="resume_input_mod2",
        placeholder="Enter resume text here...",
    )

    if st.button("Extract and Categorize Skills", type="primary"):
        try:
            result = extract_and_categorize_skills(resume_text)

            st.metric("Total Skills Found", result["total_skills"])

            if result["total_skills"] > 0:
                st.success("Skill extraction completed successfully.")
            else:
                st.warning("No skills were detected. Try a richer resume text.")

            # Create a dataframe for clean category-wise display
            rows = []
            for category, skills in result["skills_by_category"].items():
                rows.append({
                    "Category": category,
                    "Skill Count": len(skills),
                    "Skills": ", ".join(skills),
                })

            if rows:
                st.dataframe(pd.DataFrame(rows), use_container_width=True)

            with st.expander("Strong Categories"):
                strong = result["strong_categories"]
                st.write(", ".join(strong) if strong else "No strong category identified yet.")

            with st.expander("Missing Categories"):
                missing = result["missing_categories"]
                st.write(", ".join(missing) if missing else "All categories have at least one skill.")

            with st.expander("Suggested In-demand Skills to Add"):
                suggestions = result["suggested_skills"]
                st.write(", ".join(suggestions) if suggestions else "Great profile coverage for current in-demand skills.")

        except Exception as exc:
            st.error(str(exc))


def show_summarizer_page() -> None:
    """Render module 3 UI and actions."""
    st.markdown("## Module 3: Resume Summarizer")
    st.write(
        "This module generates a concise professional summary by scoring sentences with "
        "TF-IDF-inspired word importance and selecting top-ranked sentences."
    )

    if "resume_input_mod3" not in st.session_state:
        st.session_state["resume_input_mod3"] = ""

    if st.button("Load Example Resume", key="btn_example_resume_m3"):
        st.session_state["resume_input_mod3"] = SAMPLE_RESUME

    resume_text = st.text_area(
        "Paste Resume Text for Summarization",
        height=300,
        key="resume_input_mod3",
        placeholder="Enter resume text here...",
    )

    if st.button("Generate Professional Summary", type="primary"):
        try:
            result = generate_resume_summary(resume_text)

            st.success("Summary generated successfully.")
            st.write("### Generated Summary")
            st.write(result["summary"])

            c1, c2, c3 = st.columns(3)
            c1.metric("Original Words", result["original_word_count"])
            c2.metric("Summary Words", result["summary_word_count"])
            c3.metric("Compression Ratio", f"{result['compression_ratio']}%")

            with st.expander("Summary Details"):
                st.write(f"Selected Sentences: {result['selected_sentence_count']}")
                st.write("Compression ratio shows what percentage of the original text remains in summary form.")

        except Exception as exc:
            st.error(str(exc))


# -----------------------------------------------------------------------------
# Main application entry point
# -----------------------------------------------------------------------------
def main() -> None:
    """Compose sidebar navigation and route to selected module page."""
    st.set_page_config(page_title=APP_TITLE, page_icon="📄", layout="wide")
    apply_custom_style()

    st.sidebar.title("Navigation")
    selected_page = st.sidebar.radio(
        "Go to",
        [
            "Home",
            "Resume-JD Matcher",
            "Skill Extractor",
            "Resume Summarizer",
        ],
    )

    st.sidebar.markdown("---")
    st.sidebar.caption("Built using Streamlit + NLTK + Scikit-learn")

    if selected_page == "Home":
        show_home_page()
    elif selected_page == "Resume-JD Matcher":
        show_matcher_page()
    elif selected_page == "Skill Extractor":
        show_skill_extractor_page()
    elif selected_page == "Resume Summarizer":
        show_summarizer_page()


if __name__ == "__main__":
    main()
