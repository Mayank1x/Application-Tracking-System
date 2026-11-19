"""
jd_parser.py — Intelligent Job Description Parser.

Extracts:
  - Job Title / Role
  - Experience Requirements (Min years, Max years, Required level)
  - Mandatory ("Must Have") vs Bonus ("Good to Have") Skills
  - Minimum Education Qualification
  - Core Responsibilities / Responsibilities Snippet (for Semantic Embedding)
"""

import re
from typing import Dict, List, Optional, Set, Tuple

from candidate_extractor import (
    KNOWN_SKILLS,
    SKILL_ALIASES,
    DEGREE_PATTERNS,
    normalize_skill,
)


def extract_job_title(jd_text: str) -> str:
    """Extract job title from the first few lines or explicit 'Title:' markers."""
    lines = [line.strip() for line in jd_text.split("\n") if line.strip()]
    
    # Check for explicit "Title: XYZ" or "Role: XYZ"
    title_pattern = re.search(r"(?:job\s*title|role|position)\s*:\s*([^\n\r]+)", jd_text, re.IGNORECASE)
    if title_pattern:
        return title_pattern.group(1).strip()

    # Otherwise look at the first non-empty lines
    for line in lines[:5]:
        clean = re.sub(r"[#*_]", "", line).strip()
        words = clean.split()
        if 2 <= len(words) <= 6:
            lower = clean.lower()
            if any(term in lower for term in ["engineer", "developer", "architect", "lead", "scientist", "manager", "intern", "analyst", "specialist"]):
                return clean.title()

    return "Software Engineer"


def extract_required_experience(jd_text: str) -> Dict[str, any]:
    """
    Extract required years of experience (min, max, level).
    Handles patterns like:
      - '3-5 years of experience'
      - 'minimum 4+ years'
      - 'at least 2 years'
      - '5+ yrs experience'
    """
    text_lower = jd_text.lower()
    
    # Pattern 1: Range like '3 to 5 years' or '3-5 years'
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)", text_lower)
    if range_match:
        min_y = float(range_match.group(1))
        max_y = float(range_match.group(2))
        return {
            "min_years": min_y,
            "max_years": max_y,
            "display": f"{min_y:g}–{max_y:g} years",
            "tier": "Senior" if min_y >= 5 else "Mid-Level" if min_y >= 2 else "Junior / Entry",
        }

    # Pattern 2: Single number like '3+ years', 'minimum 3 years', 'at least 5 yrs'
    single_patterns = [
        r"(?:min(?:imum)?|at\s+least|over)?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:professional|relevant|work|industry))?\s+experience",
        r"experience\s*(?:required)?\s*:\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)",
    ]
    for pat in single_patterns:
        m = re.search(pat, text_lower)
        if m:
            min_y = float(m.group(1))
            if 0 < min_y <= 20:
                return {
                    "min_years": min_y,
                    "max_years": None,
                    "display": f"{min_y:g}+ years",
                    "tier": "Senior" if min_y >= 5 else "Mid-Level" if min_y >= 2 else "Junior / Entry",
                }

    # Default to 2 years if unstated for industry roles
    return {
        "min_years": 2.0,
        "max_years": None,
        "display": "2+ years (recommended)",
        "tier": "Mid-Level",
    }


def extract_required_education(jd_text: str) -> Dict[str, any]:
    """Extract minimum degree requirement."""
    text_lower = jd_text.lower()
    highest_degree = "Bachelor's"
    degree_tier = 2

    for pattern, deg_name, tier in DEGREE_PATTERNS:
        if re.search(pattern, text_lower):
            if tier > degree_tier:
                degree_tier = tier
                highest_degree = deg_name

    return {
        "required_degree": highest_degree,
        "degree_tier": degree_tier,
    }


def extract_categorized_jd_skills(jd_text: str) -> Dict[str, List[str]]:
    """
    Split JD into sections and categorize skills into:
      - Mandatory ("Must-Have")
      - Bonus / Preferred ("Good-to-Have")
    """
    text_lower = jd_text.lower()
    
    # Identify section splits
    must_have_headers = ["requirements", "must have", "required skills", "qualifications", "what you'll need", "key requirements", "essential"]
    nice_to_have_headers = ["nice to have", "good to have", "preferred qualifications", "bonus", "plusses", "preferred skills", "what gives you an edge"]

    # Simple section segmentation
    must_have_text = ""
    nice_have_text = ""
    general_text = text_lower

    # Split lines and track current context
    current_mode = "general"
    lines = text_lower.split("\n")
    for line in lines:
        stripped = line.strip()
        if any(h in stripped for h in nice_to_have_headers):
            current_mode = "nice"
            continue
        elif any(h in stripped for h in must_have_headers):
            current_mode = "must"
            continue
        
        if current_mode == "must":
            must_have_text += " " + stripped
        elif current_mode == "nice":
            nice_have_text += " " + stripped

    def find_skills_in(segment: str) -> Set[str]:
        found = set()
        for skill in KNOWN_SKILLS:
            if re.search(r"\b" + re.escape(skill) + r"\b", segment):
                found.add(skill)
        for alias, canonical in SKILL_ALIASES.items():
            if re.search(r"\b" + re.escape(alias) + r"\b", segment):
                found.add(canonical)
        return found

    all_found = find_skills_in(general_text)
    must_found = find_skills_in(must_have_text) if must_have_text else set()
    nice_found = find_skills_in(nice_have_text) if nice_have_text else set()

    # If explicit sections were found, distribute:
    if must_found or nice_found:
        mandatory = must_found
        bonus = nice_found - mandatory
        # Remaining skills in JD not explicitly in nice-to-have become mandatory
        remaining = all_found - mandatory - bonus
        mandatory.update(remaining)
    else:
        # If no explicit "nice-to-have" section, prioritize top technical skills as mandatory
        # and soft skills/general tools as bonus
        mandatory = set()
        bonus = set()
        for s in all_found:
            if s in ["communication", "teamwork", "leadership", "adaptability", "jira", "figma"]:
                bonus.add(s)
            else:
                mandatory.add(s)

    return {
        "all_skills": sorted(list(all_found)),
        "mandatory_skills": sorted(list(mandatory)),
        "bonus_skills": sorted(list(bonus)),
    }


def parse_job_description(jd_text: str) -> Dict:
    """
    Parse a Job Description into a structured target specification.
    """
    clean_text = jd_text.strip()
    title = extract_job_title(clean_text)
    exp = extract_required_experience(clean_text)
    edu = extract_required_education(clean_text)
    skills = extract_categorized_jd_skills(clean_text)

    # Core responsibilities snippet (for dense semantic embedding)
    paragraphs = [p.strip() for p in clean_text.split("\n\n") if len(p.strip()) > 50]
    responsibilities_text = " ".join(paragraphs[:3]) if paragraphs else clean_text[:500]

    return {
        "title": title,
        "experience": exp,
        "education": edu,
        "skills": skills,
        "all_skills": skills["all_skills"],
        "mandatory_skills": skills["mandatory_skills"],
        "bonus_skills": skills["bonus_skills"],
        "responsibilities_text": responsibilities_text,
        "raw_text": clean_text,
    }
