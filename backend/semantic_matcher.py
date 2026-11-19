"""
semantic_matcher.py — BERT-based semantic skill matching.
Uses sentence-transformers/all-MiniLM-L6-v2 for embedding comparison.
"""

import re
from typing import Dict, List, Tuple

_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
            print("[SemanticMatcher] Model loaded: all-MiniLM-L6-v2")
        except ImportError:
            raise RuntimeError("sentence-transformers not installed: pip install sentence-transformers")
    return _model


def _extract_phrases(text: str) -> List[str]:
    """Extract meaningful phrases (1–3 word chunks) from text."""
    text = re.sub(r"[^a-zA-Z0-9\s.#+/]", " ", text.lower())
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split()
    phrases = set()
    for w in words:
        if len(w) > 1:
            phrases.add(w)
    for i in range(len(words) - 1):
        bigram = f"{words[i]} {words[i+1]}"
        if len(bigram) > 4:
            phrases.add(bigram)
    for i in range(len(words) - 2):
        trigram = f"{words[i]} {words[i+1]} {words[i+2]}"
        if len(trigram) > 6:
            phrases.add(trigram)
    return list(phrases)


def _extract_jd_skills(jd_text: str) -> List[str]:
    """Pull skill-like phrases from a JD using heuristics."""
    known = [
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "html",
        "css", "react", "react.js", "angular", "vue", "vue.js", "node", "node.js",
        "express", "django", "flask", "fastapi", "spring", "rails",
        "machine learning", "deep learning", "nlp", "natural language processing",
        "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn",
        "pandas", "numpy", "matplotlib", "seaborn", "tableau", "power bi",
        "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins",
        "git", "github", "gitlab", "ci/cd", "terraform", "ansible",
        "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "firebase",
        "rest api", "graphql", "microservices", "agile", "scrum",
        "data analysis", "data engineering", "data science", "ml", "ai",
        "linux", "bash", "powershell", "networking", "cybersecurity",
        "figma", "sketch", "adobe xd", "ui/ux", "ux design", "ui design",
        "communication", "leadership", "teamwork", "problem solving",
        "project management", "critical thinking",
        "js", "ts", "devops", "backend", "frontend", "full stack",
    ]
    jd_lower = jd_text.lower()
    found = []
    for skill in known:
        if re.search(r'\b' + re.escape(skill) + r'\b', jd_lower):
            found.append(skill)
    return found if found else _extract_phrases(jd_text)[:30]


def semantic_match(resume_text: str, jd_text: str, threshold: float = 0.70) -> Dict:
    """
    Compare resume vs JD using both exact keyword and BERT semantic matching.
    Returns side-by-side comparison data.
    """
    import numpy as np
    model = _get_model()

    jd_skills = _extract_jd_skills(jd_text)
    resume_phrases = _extract_phrases(resume_text)

    if not jd_skills or not resume_phrases:
        return {"error": "Could not extract enough content for comparison."}

    # Exact matches (case-insensitive substring)
    resume_lower = resume_text.lower()
    exact_matches = []
    exact_missed = []
    for skill in jd_skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', resume_lower):
            exact_matches.append(skill)
        else:
            exact_missed.append(skill)

    # Semantic matches using BERT embeddings
    jd_embeddings = model.encode(jd_skills, convert_to_numpy=True, normalize_embeddings=True)
    resume_embeddings = model.encode(resume_phrases, convert_to_numpy=True, normalize_embeddings=True)

    similarity_matrix = np.dot(jd_embeddings, resume_embeddings.T)

    semantic_matches = []
    semantic_details = []
    for i, skill in enumerate(jd_skills):
        best_idx = int(np.argmax(similarity_matrix[i]))
        best_score = float(similarity_matrix[i][best_idx])
        best_phrase = resume_phrases[best_idx]
        if best_score >= threshold:
            semantic_matches.append(skill)
            semantic_details.append({
                "jd_skill": skill,
                "resume_match": best_phrase,
                "similarity": round(best_score * 100, 1),
            })

    # Semantic-only matches (found by BERT but missed by keyword)
    semantic_only = [s for s in semantic_matches if s not in exact_matches]

    exact_score = round(len(exact_matches) / len(jd_skills) * 100, 1) if jd_skills else 0
    semantic_score = round(len(semantic_matches) / len(jd_skills) * 100, 1) if jd_skills else 0

    return {
        "jd_skills_total": len(jd_skills),
        "jd_skills": jd_skills,
        "exact_matches": exact_matches,
        "exact_match_count": len(exact_matches),
        "exact_score": exact_score,
        "semantic_matches": semantic_matches,
        "semantic_match_count": len(semantic_matches),
        "semantic_score": semantic_score,
        "semantic_only": semantic_only,
        "semantic_only_count": len(semantic_only),
        "semantic_details": semantic_details,
        "missed_by_both": [s for s in jd_skills if s not in semantic_matches],
        "improvement": len(semantic_only),
    }
