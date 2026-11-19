"""
gemini_engine.py — Gemini AI integration for deep resume analysis.

Uses google-generativeai with gemini-2.0-flash for:
1. Deep semantic match analysis
2. Line-by-line change suggestions
3. Full resume rewriting based on JD
"""

import os
import json
import re
from typing import Dict, Optional


def _load_env_file(path: str) -> None:
    """Load KEY=VALUE pairs from a .env file without external dependencies."""
    if not os.path.exists(path):
        return
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key:
                    os.environ.setdefault(key, value)
    except Exception:
        # Keep startup resilient if .env contains malformed lines.
        pass

# Load project-level environment variables from Resume Matcher Project/.env
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_load_env_file(os.path.join(PROJECT_ROOT, ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_AVAILABLE = False
model = None

try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        GEMINI_AVAILABLE = True
        print("Gemini AI connected (gemini-2.0-flash)")
    else:
        print("GEMINI_API_KEY not set. Gemini features disabled.")
except ImportError:
    print("google-generativeai not installed. Gemini features disabled.")
except Exception as e:
    print(f"Gemini init error: {e}")


def _call_gemini(prompt: str) -> Optional[str]:
    """Send prompt to Gemini and return text response."""
    if not GEMINI_AVAILABLE or not model:
        return None
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None


def _extract_json(text: str) -> Optional[Dict]:
    """Try to extract JSON from Gemini response text."""
    if not text:
        return None
    # Try to find JSON block in markdown code fences
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    # Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    return None


def gemini_deep_analysis(resume_text: str, jd_text: str) -> Optional[Dict]:
    """
    Deep semantic analysis of resume vs JD using Gemini.
    Returns structured feedback with scores and suggestions.
    """
    prompt = f"""You are a professional ATS resume analyst. Analyze this resume against the job description.

RESUME:
{resume_text[:4000]}

JOB DESCRIPTION:
{jd_text[:3000]}

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{{
  "relevancy_score": <number 0-100>,
  "semantic_match": "<one of: Strong Match, Good Match, Partial Match, Weak Match>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "missing_qualifications": ["<missing 1>", "<missing 2>"],
  "keyword_suggestions": ["<keyword to add 1>", "<keyword to add 2>", "<keyword to add 3>"],
  "section_feedback": {{
    "summary": "<feedback on professional summary>",
    "experience": "<feedback on experience section>",
    "skills": "<feedback on skills section>",
    "education": "<feedback on education section>"
  }},
  "overall_verdict": "<2-3 sentence overall assessment>"
}}"""

    raw = _call_gemini(prompt)
    if not raw:
        return None
    result = _extract_json(raw)
    if result:
        return result
    # Fallback: return raw text as verdict
    return {"overall_verdict": raw[:500], "relevancy_score": 0}


def gemini_change_suggestions(resume_text: str, jd_text: str) -> Optional[Dict]:
    """
    Get precise, line-by-line change suggestions from Gemini.
    """
    prompt = f"""You are an expert resume coach. Review this resume against the job description and provide specific, actionable changes.

RESUME:
{resume_text[:4000]}

JOB DESCRIPTION:
{jd_text[:3000]}

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{{
  "changes": [
    {{
      "section": "<which section to modify>",
      "original": "<exact text or bullet to change>",
      "suggested": "<improved version>",
      "reason": "<why this change improves ATS score>"
    }}
  ],
  "additions": [
    {{
      "section": "<where to add>",
      "content": "<what to add>",
      "priority": "<high/medium/low>"
    }}
  ],
  "removals": [
    {{
      "text": "<what to remove or reduce>",
      "reason": "<why>"
    }}
  ]
}}

Provide at least 5 specific changes, 3 additions, and 1-2 removals."""

    raw = _call_gemini(prompt)
    if not raw:
        return None
    return _extract_json(raw) or {"raw_suggestions": raw[:1000]}


def gemini_rewrite_resume(resume_text: str, jd_text: str) -> Optional[str]:
    """
    Generate a complete ATS-optimized resume rewrite based on the JD.
    """
    prompt = f"""You are a professional resume writer. Rewrite this resume to maximize its match with the target job description while maintaining honesty and the candidate's actual experience.

ORIGINAL RESUME:
{resume_text[:4000]}

TARGET JOB DESCRIPTION:
{jd_text[:3000]}

Rules:
- Keep all factual information (dates, companies, education) accurate
- Optimize bullet points with action verbs, metrics, and JD keywords
- Reorder sections to highlight most relevant experience first
- Add a tailored professional summary
- Include a skills section prioritized by JD relevance
- Use standard ATS-friendly formatting (no tables, no columns, no graphics)
- Each bullet point should follow: Action Verb + Task + Tool/Method + Result/Impact

Return ONLY the rewritten resume text, no explanations or commentary."""

    return _call_gemini(prompt)
