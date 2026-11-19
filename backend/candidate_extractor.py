"""
candidate_extractor.py — Extract structured candidate profile from resume text.

Features:
  - Robust section segmentation (Education, Experience, Projects, Skills)
  - Section-aware experience parser (NEVER counts education/degree dates as work experience)
  - Internship detection (internships/academic projects count as 0 full-time years / Fresher)
  - Name, Contact (Email, Phone, LinkedIn, GitHub), and Education degree tier extraction
  - Skill normalization with synonym mappings (e.g., K8s -> Kubernetes, React.js -> React)
"""

import re
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

# ---------------------------------------------------------------------------
# Skill Synonym / Alias Normalization Map
# ---------------------------------------------------------------------------
SKILL_ALIASES: Dict[str, str] = {
    # Cloud & DevOps
    "k8s": "kubernetes",
    "kube": "kubernetes",
    "amazon web services": "aws",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "azure cloud": "azure",
    "microsoft azure": "azure",
    "cicd": "ci/cd",
    "ci-cd": "ci/cd",
    "continuous integration": "ci/cd",
    "docker containers": "docker",
    
    # Frameworks & Libraries
    "react.js": "react",
    "reactjs": "react",
    "node.js": "node.js",
    "nodejs": "node.js",
    "vue.js": "vue",
    "vuejs": "vue",
    "angular.js": "angular",
    "angularjs": "angular",
    "next.js": "next.js",
    "nextjs": "next.js",
    "express.js": "express",
    "expressjs": "express",
    "fast api": "fastapi",
    "restful api": "rest api",
    "restful apis": "rest api",
    "restful": "rest api",
    "rest apis": "rest api",
    
    # Languages
    "js": "javascript",
    "ts": "typescript",
    "golang": "go",
    "py": "python",
    "c plus plus": "c++",
    "c sharp": "c#",
    
    # AI & ML
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "genai": "generative ai",
    "gen ai": "generative ai",
    "llm": "llms",
    "large language models": "llms",
    "large language model": "llms",
    "sklearn": "scikit-learn",
    "tf": "tensorflow",
    
    # Databases
    "postgres": "postgresql",
    "mongo": "mongodb",
    "ms sql": "sql server",
    "mssql": "sql server",
    "dynamo": "dynamodb",
}

# Standardized Core Taxonomy for Matching
KNOWN_SKILLS: List[str] = [
    # Languages
    "python", "java", "c", "c++", "c#", "javascript", "typescript", "go",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "html", "css",
    
    # Frontend & Fullstack
    "react", "angular", "vue", "next.js", "tailwind", "bootstrap", "redux", "jquery",
    
    # Backend & Frameworks
    "node.js", "express", "django", "flask", "fastapi", "spring boot", "spring",
    "ruby on rails", "asp.net", "rest api", "graphql", "grpc", "microservices",
    
    # AI, ML & Data Science
    "machine learning", "deep learning", "natural language processing", "computer vision",
    "generative ai", "llms", "rag", "transformers", "hugging face", "langchain",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
    "seaborn", "opencv", "spacy", "nltk",
    
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "terraform", "ansible",
    "jenkins", "git", "github", "gitlab", "linux", "bash", "powershell",
    
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "firebase", "dynamodb", "cassandra", "neo4j",
    
    # Data Engineering & BI
    "spark", "hadoop", "kafka", "airflow", "snowflake", "databricks", "power bi", "tableau",
    
    # Methodologies & Tools
    "agile", "scrum", "jira", "figma", "postman", "swagger", "unit testing", "system design",
    
    # Soft Skills
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
    "adaptability", "project management", "time management",
]

DEGREE_PATTERNS = [
    (r"\b(ph\.?d|doctor of philosophy|doctorate)\b", "Ph.D.", 4),
    (r"\b(m\.?tech|master of technology|m\.?s|master of science|mca|m\.?e|mba)\b", "Master's", 3),
    (r"\b(b\.?tech|bachelor of technology|b\.?e|bachelor of engineering|b\.?s|bachelor of science|bca|b\.?sc|bachelor)\b", "Bachelor's", 2),
    (r"\b(diploma|associate degree|associate)\b", "Associate / Diploma", 1),
]

MONTH_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "september": 9, "oct": 10, "october": 10,
    "nov": 11, "november": 11, "dec": 12, "december": 12,
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill token using synonym mappings."""
    s = skill.strip().lower()
    return SKILL_ALIASES.get(s, s)


# ---------------------------------------------------------------------------
# Section Segmenter
# ---------------------------------------------------------------------------
def segment_resume_sections(text: str) -> Dict[str, str]:
    """
    Split resume text into sections: education, experience, projects, skills, other.
    Ensures dates in education/projects are never counted as work experience.
    """
    section_patterns = {
        "education": r"\b(education|academic\s+qualifications?|academics?|degrees?)\b",
        "experience": r"\b(work\s+experience|professional\s+experience|employment\s+history|experience|work\s+history)\b",
        "projects": r"\b(projects|academic\s+projects|personal\s+projects|key\s+projects)\b",
        "skills": r"\b(technical\s+skills|skills\s+and\s+tools|core\s+competencies|skills)\b",
    }

    lines = text.split("\n")
    sections = {
        "header": [],
        "education": [],
        "experience": [],
        "projects": [],
        "skills": [],
        "other": []
    }

    current_section = "header"

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        lower = stripped.lower()
        matched_section = None

        # Check if line is a section heading (typically short, uppercase or prominent)
        if len(stripped.split()) <= 4:
            clean_hdr = re.sub(r"[^a-zA-Z\s]", "", lower).strip()
            for sec_name, pat in section_patterns.items():
                if re.fullmatch(pat, clean_hdr):
                    matched_section = sec_name
                    break

        if matched_section:
            current_section = matched_section
            continue

        sections[current_section].append(stripped)

    return {k: "\n".join(v) for k, v in sections.items()}


# ---------------------------------------------------------------------------
# Candidate Name Extraction
# ---------------------------------------------------------------------------
def extract_candidate_name(text: str, filename: Optional[str] = None) -> str:
    """Extract candidate name from top lines or fallback to filename."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    skip_keywords = {
        "resume", "curriculum", "vitae", "cv", "profile", "contact",
        "email", "phone", "address", "page", "portfolio", "github", "linkedin",
        "summary", "experience", "education", "skills", "projects", "objective",
        "developer", "engineer", "software", "scientist", "analyst", "intern"
    }

    for line in lines[:8]:
        clean = re.sub(r"[^a-zA-Z\s]", " ", line).strip()
        words = clean.split()
        if 2 <= len(words) <= 4:
            lower_words = [w.lower() for w in words]
            if any(w in skip_keywords for w in lower_words):
                continue
            all_title = all(w[0].isupper() for w in words if w)
            all_upper = clean.isupper()
            if (all_title or all_upper) and all(len(w) >= 2 for w in words):
                return " ".join([w.capitalize() for w in words])

    if filename:
        base = filename.rsplit(".", 1)[0]
        base = re.sub(r"(resume|cv|_|-|\d+)", " ", base, flags=re.IGNORECASE).strip()
        words = [w.capitalize() for w in base.split() if len(w) > 1]
        if words:
            return " ".join(words)

    return "Candidate"


# ---------------------------------------------------------------------------
# Contact Information Extraction
# ---------------------------------------------------------------------------
def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """Extract email, phone, LinkedIn, and GitHub links."""
    email_match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", text)
    email = email_match.group(0).lower() if email_match else None

    phone_match = re.search(
        r"(?:(?:\+|0{0,2})\d{1,3}[\s-]*)?(?:\(?\d{3}\)?[\s-]*)?\d{3}[\s-]?\d{4}\b",
        text,
    )
    phone = phone_match.group(0).strip() if phone_match else None

    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
    linkedin = f"linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None

    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
    github = f"github.com/{github_match.group(1)}" if github_match else None

    return {
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
    }


# ---------------------------------------------------------------------------
# Section-Aware Experience (Years) Extraction
# ---------------------------------------------------------------------------
def extract_experience_years(text: str) -> Tuple[float, str]:
    """
    Accurately computes full-time professional experience:
      - STRICTLY excludes education / degree dates (e.g. B.Tech 2019-2023 is NOT work experience).
      - STRICTLY identifies internships / college training as 0 full-time years (Fresher).
      - ONLY parses employment dates located inside the work experience section.
    """
    sections = segment_resume_sections(text)
    exp_text = sections.get("experience", "").strip()
    
    # If no distinct experience section, check full text but purge education block
    if not exp_text:
        edu_text = sections.get("education", "")
        purged = text
        if edu_text:
            purged = text.replace(edu_text, "")
        exp_text = purged

    exp_lower = exp_text.lower()
    full_lower = text.lower()
    current_year = datetime.now().year
    current_month = datetime.now().month

    # Check if candidate is purely an intern / student / fresher
    intern_keywords = ["intern", "internship", "trainee", "student", "graduate student", "fresher"]
    is_purely_intern = False
    
    # If all positions mentioned in experience section contain 'intern'
    has_fulltime_role = any(
        title in exp_lower for title in [
            "software engineer", "developer", "lead", "architect", "data scientist",
            "consultant", "analyst", "administrator", "devops engineer", "specialist"
        ]
        if "intern" not in title and "trainee" not in title
    )
    
    # If there are explicit statements of FULL-TIME professional experience
    explicit_pat = r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional|industry|full[- ]time)\s+experience"
    explicit_matches = re.findall(explicit_pat, full_lower)
    explicit_years = 0.0
    for m in explicit_matches:
        try:
            val = float(m)
            # Sanity check: must not exceed reasonable range
            if 0.5 <= val <= 35:
                explicit_years = max(explicit_years, val)
        except ValueError:
            pass

    # If resume contains phrases like '0 years' or 'seeking entry level'
    if re.search(r"\b(entry[- ]level|fresher|0\s*years?|recent graduate)\b", full_lower) and not has_fulltime_role:
        return 0.0, "Fresher / Entry-Level (0 years full-time experience)"

    # Parse date ranges ONLY from the experience section
    month_names = r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
    date_regex = re.compile(
        rf"(?:({month_names})\.?\s+)?(20\d{{2}}|19\d{{2}})\s*(?:–|-|to)\s*(?:({month_names})\.?\s+)?(20\d{{2}}|19\d{{2}}|present|current|now)",
        re.IGNORECASE,
    )

    intervals = []
    has_internship_only = True

    # Split experience by lines/paragraphs and check each role
    exp_lines = exp_text.split("\n")
    current_role_is_intern = False

    for line in exp_lines:
        line_l = line.lower()
        if any(w in line_l for w in ["intern", "internship", "trainee", "academic project"]):
            current_role_is_intern = True
        elif any(w in line_l for w in ["engineer", "developer", "analyst", "lead", "architect", "full time", "consultant"]):
            if "intern" not in line_l:
                current_role_is_intern = False

        for match in date_regex.finditer(line):
            start_m_str, start_y_str, end_m_str, end_y_str = match.groups()
            start_year = int(start_y_str)
            if start_year > current_year or start_year < 1980:
                continue

            # If this line or block is an internship, do not count towards full-time career duration
            if current_role_is_intern or any(w in line_l for w in ["intern", "internship", "trainee"]):
                continue

            has_internship_only = False
            start_month = MONTH_MAP.get(start_m_str.lower(), 1) if start_m_str else 1
            if end_y_str.lower() in ("present", "current", "now"):
                end_year = current_year
                end_month = current_month
            else:
                end_year = int(end_y_str)
                end_month = MONTH_MAP.get(end_m_str.lower(), 12) if end_m_str else 12

            start_total = start_year * 12 + start_month
            end_total = end_year * 12 + end_month
            if end_total >= start_total:
                intervals.append((start_total, end_total))

    timeline_years = 0.0
    if intervals:
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0]]
        for current in intervals[1:]:
            prev_start, prev_end = merged[-1]
            curr_start, curr_end = current
            if curr_start <= prev_end:
                merged[-1] = (prev_start, max(prev_end, curr_end))
            else:
                merged.append(current)

        total_months = sum((end - start + 1) for start, end in merged)
        timeline_years = round(total_months / 12.0, 1)

    # Determine final experience
    if timeline_years > 0:
        chosen_years = timeline_years
        detail = f"{chosen_years} yrs (documented professional employment)"
    elif explicit_years > 0:
        chosen_years = explicit_years
        detail = f"{chosen_years} yrs (stated in resume profile)"
    else:
        # Candidate has 0 years full-time experience (e.g. college graduate or internship only)
        if any(w in exp_lower for w in ["intern", "internship"]):
            detail = "0 yrs (Internship / Training experience only)"
        else:
            detail = "0 yrs (Fresher / Entry level)"
        chosen_years = 0.0

    return chosen_years, detail


# ---------------------------------------------------------------------------
# Education Extraction
# ---------------------------------------------------------------------------
def extract_education(text: str) -> Dict[str, any]:
    """Extract highest degree level, discipline, and graduation year."""
    text_lower = text.lower()
    highest_degree = "Bachelor's"
    degree_tier = 2

    for pattern, deg_name, tier in DEGREE_PATTERNS:
        if re.search(pattern, text_lower):
            if tier > degree_tier:
                degree_tier = tier
                highest_degree = deg_name

    disciplines = [
        "computer science", "information technology", "data science",
        "artificial intelligence", "electrical engineering", "electronics",
        "software engineering", "mechanical engineering", "mathematics",
        "statistics", "business administration", "physics"
    ]
    detected_discipline = None
    for disc in disciplines:
        if disc in text_lower:
            detected_discipline = disc.title()
            break

    grad_year_match = re.search(r"\b(?:batch|graduated|class of|passing year|passed in)?\s*(20[12]\d)\b", text_lower)
    grad_year = grad_year_match.group(1) if grad_year_match else None

    return {
        "highest_degree": highest_degree,
        "degree_tier": degree_tier,
        "discipline": detected_discipline or "Computer Science",
        "graduation_year": grad_year,
    }


# ---------------------------------------------------------------------------
# Skill Extraction with Synonyms & Deduplication
# ---------------------------------------------------------------------------
def extract_candidate_skills(text: str) -> List[str]:
    """Extract skills from text, normalize aliases, and deduplicate."""
    text_lower = text.lower()
    found_skills = set()

    for skill in KNOWN_SKILLS:
        if re.search(r"\b" + re.escape(skill) + r"\b", text_lower):
            found_skills.add(skill)

    for alias, canonical in SKILL_ALIASES.items():
        if re.search(r"\b" + re.escape(alias) + r"\b", text_lower):
            found_skills.add(canonical)

    return sorted(list(found_skills))


# ---------------------------------------------------------------------------
# High-Level Profile Extractor
# ---------------------------------------------------------------------------
def extract_candidate_profile(text: str, filename: Optional[str] = None) -> Dict:
    """Transform raw resume text into a clean structured candidate profile."""
    name = extract_candidate_name(text, filename)
    contact = extract_contact_info(text)
    exp_years, exp_detail = extract_experience_years(text)
    education = extract_education(text)
    skills = extract_candidate_skills(text)

    # Clean summary (first ~250 chars of non-contact text)
    cleaned_lines = [
        line.strip() for line in text.split("\n")
        if line.strip() and len(line.strip()) > 30 and "@" not in line and "linkedin" not in line.lower()
    ]
    summary_snippet = " ".join(cleaned_lines[:2])[:260] if cleaned_lines else "Candidate profile."

    return {
        "name": name,
        "filename": filename or "resume",
        "email": contact["email"],
        "phone": contact["phone"],
        "linkedin": contact["linkedin"],
        "github": contact["github"],
        "experience_years": exp_years,
        "experience_formatted": f"{exp_years:g} years" if exp_years > 0 else "0 years (Fresher)",
        "experience_explanation": exp_detail,
        "education": education,
        "skills": skills,
        "skills_count": len(skills),
        "summary": summary_snippet,
        "raw_text": text,
    }
