"""
ai_coach.py — Rule-based resume coaching chat using existing NLP modules.
Intent detection via keyword matching, dispatches to existing analysis functions.
"""

import re
from typing import Dict


def detect_intent(message: str) -> str:
    """Detect user intent from chat message using keyword patterns."""
    msg = message.lower().strip()

    if any(k in msg for k in ["missing skill", "what skill", "skill gap", "skills for", "skills do i need"]):
        return "missing_skills"
    if any(k in msg for k in ["data scien", "machine learn", "ml ", "ai role", "data analyst"]):
        return "role_match"
    if any(k in msg for k in ["improve", "better", "increase score", "fix", "enhance", "upgrade"]):
        return "improve"
    if any(k in msg for k in ["ats", "tracking system", "ats friendly", "ats compatible", "ats score"]):
        return "ats_check"
    if any(k in msg for k in ["action verb", "bullet", "weak bullet", "strong bullet", "impact"]):
        return "bullets"
    if any(k in msg for k in ["summarize", "summary", "tldr", "brief"]):
        return "summarize"
    if any(k in msg for k in ["score", "grade", "rate", "rating", "how good"]):
        return "score"
    if any(k in msg for k in ["predict", "role", "job", "career", "best fit", "suited"]):
        return "predict_role"
    if any(k in msg for k in ["skill", "extract", "what skill", "my skill"]):
        return "extract_skills"
    if any(k in msg for k in ["hello", "hi", "hey", "help", "what can you"]):
        return "greeting"

    return "general"


def process_chat(resume_text: str, message: str) -> Dict:
    """Process a chat message and return structured response."""
    intent = detect_intent(message)

    if intent == "greeting":
        return {
            "intent": intent,
            "response": "Hello! I'm your AI resume coach. Upload your resume and ask me anything about it. Try asking: 'What's my resume score?', 'What skills am I missing?', or 'Is my resume ATS friendly?'",
            "data": None,
        }

    if not resume_text or len(resume_text) < 20:
        return {
            "intent": intent,
            "response": "Please upload or paste your resume first so I can analyze it.",
            "data": None,
        }

    try:
        if intent == "score":
            from score_card import compute_score_card
            data = compute_score_card(resume_text)
            resp = f"Your resume scores {data['total_score']}/100 (Grade: {data['grade']}). "
            resp += f"You're in the top {100 - data['percentile']}% of resumes. "
            if data["top_fixes"]:
                resp += "Here are your top areas to improve: " + " | ".join(data["top_fixes"][:2])
            return {"intent": intent, "response": resp, "data": data}

        elif intent == "extract_skills" or intent == "missing_skills":
            from nlp_engine import extract_and_categorize_skills
            data = extract_and_categorize_skills(resume_text)
            resp = f"I found {data['total_skills']} skills across {len([c for c in data['skills_by_category'] if data['skills_by_category'][c]])} categories. "
            if data["missing_categories"]:
                resp += f"You're missing skills in: {', '.join(data['missing_categories'])}. "
            if data["suggested_skills"]:
                resp += f"Consider adding: {', '.join(data['suggested_skills'][:5])}."
            return {"intent": intent, "response": resp, "data": data}

        elif intent == "ats_check":
            from nlp_engine import compute_ats_score, analyze_resume_job_match
            # Use a generic JD for standalone ATS check
            generic_jd = "Software developer with experience in programming, problem solving, communication, teamwork"
            match_r = analyze_resume_job_match(resume_text, generic_jd)
            data = compute_ats_score(resume_text, generic_jd, match_r["score"])
            resp = f"Your ATS readiness score is {data['ats_score']}/100 ({data['recommendation']}). "
            if data["improvements"]:
                resp += "Key issues: " + " | ".join(data["improvements"][:3])
            return {"intent": intent, "response": resp, "data": data}

        elif intent == "bullets":
            from nlp_engine import ACTION_VERBS
            lines = resume_text.split("\n")
            weak = []
            for line in lines:
                s = line.strip()
                if s and s[0] in "-*" and len(s) > 10:
                    clean = re.sub(r"^[-*]\s*", "", s).strip()
                    first = clean.split()[0].lower() if clean.split() else ""
                    if first not in ACTION_VERBS:
                        weak.append(clean[:80])
            resp = f"Found {len(weak)} bullets without strong action verbs. "
            if weak:
                resp += "Consider rewriting these with action verbs like Developed, Implemented, Designed, Optimized. "
                resp += "Weakest bullets: " + " | ".join(weak[:3])
            else:
                resp += "Great job — all your bullets start with action verbs!"
            return {"intent": intent, "response": resp, "data": {"weak_bullets": weak[:5]}}

        elif intent == "summarize":
            from nlp_engine import generate_resume_summary
            data = generate_resume_summary(resume_text)
            resp = f"Here's your {data['summary_word_count']}-word summary (compressed from {data['original_word_count']} words): {data['summary']}"
            return {"intent": intent, "response": resp, "data": data}

        elif intent == "predict_role" or intent == "role_match":
            from role_predictor import predict_roles
            data = predict_roles(resume_text)
            top = data["predictions"]
            resp = f"Based on your skills, your top 3 predicted roles are: "
            for i, p in enumerate(top):
                resp += f"{i+1}. {p['role']} ({p['combined_score']}%) "
            if top:
                resp += f"To strengthen your fit for {top[0]['role']}, consider adding: {', '.join(top[0]['missing_skills'][:4])}"
            return {"intent": intent, "response": resp, "data": data}

        elif intent == "improve":
            from score_card import compute_score_card
            data = compute_score_card(resume_text)
            resp = f"Your score is {data['total_score']}/100. Here's how to improve: "
            resp += " | ".join(data["top_fixes"][:3])
            return {"intent": intent, "response": resp, "data": data}

        else:
            resp = "I can help you with: resume scoring, skill analysis, ATS checks, bullet review, role prediction, and summarization. Try asking something specific like 'What's my resume score?' or 'What skills am I missing?'"
            return {"intent": "general", "response": resp, "data": None}

    except Exception as e:
        return {"intent": intent, "response": f"I encountered an error processing your request: {str(e)}", "data": None}
