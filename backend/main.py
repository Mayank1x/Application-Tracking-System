"""
main.py — FastAPI backend: Hybrid NLP + Gemini AI resume analysis.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uvicorn
import re

from nlp_engine import (
    analyze_resume_job_match, compute_ats_score,
    extract_and_categorize_skills, generate_resume_summary,
    build_ats_optimized_resume, ACTION_VERBS,
)
from file_parser import parse_file
from gemini_engine import (
    gemini_deep_analysis, gemini_change_suggestions,
    gemini_rewrite_resume, GEMINI_AVAILABLE,
)
from firebase_config import save_analysis, get_analysis_history, delete_analysis, FIREBASE_AVAILABLE
from score_card import compute_score_card
from role_predictor import predict_roles
from ai_coach import process_chat
from pdf_generator import generate_resume_pdf
from resume_audit import full_audit
from candidate_extractor import extract_candidate_profile
from jd_parser import parse_job_description
from batch_scorer import rank_candidates, score_candidate

app = FastAPI(title="Resume Analyzer API", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


# ── Models ──
class MatchRequest(BaseModel):
    resume_text: str = Field(..., min_length=20)
    job_text: str = Field(..., min_length=20)

class TextRequest(BaseModel):
    resume_text: str = Field(..., min_length=20)

class SummarizeRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)

class ChatRequest(BaseModel):
    resume_text: str = ""
    message: str = Field(..., min_length=1)

class PdfRequest(BaseModel):
    text: str = Field(..., min_length=10)


# ── Bullet analysis helper ──
def analyze_bullets(text: str) -> List[Dict]:
    results = []
    for line in text.split("\n"):
        s = line.strip()
        if not s or len(s) < 10:
            continue
        is_bullet = s[0] in "-*•◦▪●·⁃>~" or (len(s) > 2 and s[1] == "." and s[0].isdigit())
        words = s.split()
        first_word = words[0].lower() if words else ""
        
        # Also treat it as a bullet if it starts with a strong action verb (handles PDF parsers losing bullet chars)
        if not is_bullet and first_word not in ACTION_VERBS:
            continue
            
        clean = re.sub(r"^[-*•◦▪●·⁃>~]\s*|\d+\.\s*", "", s).strip()
        if len(clean) < 10:
            continue
        
        words = clean.split()
        first = words[0].lower() if words else ""
        has_verb = first in ACTION_VERBS
        has_num = bool(re.search(r"\d+\s*%|\$[\d,]+|\d+", clean))
        wc = len(words)
        score = 20 + (25 if has_verb else 0) + (20 if has_num else 0) + (15 if 8 <= wc <= 25 else 0) + 10
        tips = []
        if not has_verb:
            tips.append("Start with a strong action verb")
        if not has_num:
            tips.append("Add measurable impact (numbers, %)")
        if wc < 8:
            tips.append("Add more context and detail")
        if wc > 25:
            tips.append("Make this more concise")
        rating = "Strong" if score >= 70 else "Good" if score >= 50 else "Needs Work" if score >= 35 else "Weak"
        results.append({"text": clean, "score": min(score, 100), "rating": rating,
                        "has_action_verb": has_verb, "has_metrics": has_num,
                        "word_count": wc, "tips": tips})
    return results


# ── Endpoints ──

@app.get("/api/health")
async def health():
    return {"status": "ok", "gemini": GEMINI_AVAILABLE, "firebase": FIREBASE_AVAILABLE}


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    """Upload PDF, DOCX, or TXT and extract text."""
    try:
        content = await file.read()
        text, ftype = parse_file(content, file.filename)
        return {"text": text, "filename": file.filename, "type": ftype, "chars": len(text)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File error: {e}")


@app.post("/api/match")
async def match(req: MatchRequest):
    """NLP match + ATS score."""
    try:
        m = analyze_resume_job_match(req.resume_text, req.job_text)
        a = compute_ats_score(req.resume_text, req.job_text, m["score"])
        save_analysis("match", {"resume": req.resume_text[:200]}, {"score": m["score"], "ats": a["ats_score"]})
        return {"match": m, "ats": a}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/deep-analyze")
async def deep_analyze(req: MatchRequest):
    """Hybrid analysis: NLP scores + Gemini deep insights."""
    try:
        m = analyze_resume_job_match(req.resume_text, req.job_text)
        a = compute_ats_score(req.resume_text, req.job_text, m["score"])
        gemini_result = gemini_deep_analysis(req.resume_text, req.job_text)
        changes = gemini_change_suggestions(req.resume_text, req.job_text)
        return {
            "match": m, "ats": a,
            "gemini_analysis": gemini_result,
            "gemini_changes": changes,
            "gemini_available": GEMINI_AVAILABLE,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/rewrite")
async def rewrite(req: MatchRequest):
    """Generate a complete ATS-optimized resume rewrite using Gemini."""
    try:
        rewritten = gemini_rewrite_resume(req.resume_text, req.job_text)
        if not rewritten:
            # Fallback to NLP optimizer
            m = analyze_resume_job_match(req.resume_text, req.job_text)
            opt = build_ats_optimized_resume(req.resume_text, req.job_text, m["missing_keywords"])
            return {"rewritten_resume": opt["edited_resume"], "source": "nlp", "suggestions": opt["suggestions"]}
        return {"rewritten_resume": rewritten, "source": "gemini"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/skills")
async def skills(req: TextRequest):
    try:
        return extract_and_categorize_skills(req.resume_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/summarize")
async def summarize(req: SummarizeRequest):
    try:
        return generate_resume_summary(req.resume_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/bullet-review")
async def bullet_review(req: TextRequest):
    try:
        bullets = analyze_bullets(req.resume_text)
        avg = sum(b["score"] for b in bullets) / len(bullets) if bullets else 0
        return {"bullets": bullets, "total": len(bullets), "average_score": round(avg, 1),
                "strong_count": sum(1 for b in bullets if b["rating"] == "Strong"),
                "weak_count": sum(1 for b in bullets if b["rating"] in ("Weak", "Needs Work"))}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/history")
async def history(limit: int = 20):
    return {"history": get_analysis_history(limit), "firebase_connected": FIREBASE_AVAILABLE}


@app.delete("/api/history/{doc_id}")
async def del_history(doc_id: str):
    if not delete_analysis(doc_id):
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": True}


# ── Gen 2: AI Insights Routes ──

@app.post("/api/semantic-match")
async def sem_match(req: MatchRequest):
    try:
        from semantic_matcher import semantic_match
        return semantic_match(req.resume_text, req.job_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/score-card")
async def score_card(req: TextRequest):
    try:
        return compute_score_card(req.resume_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/role-predict")
async def role_predict(req: TextRequest):
    try:
        return predict_roles(req.resume_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/coach")
async def coach(req: ChatRequest):
    try:
        return process_chat(req.resume_text, req.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/generate-pdf")
async def gen_pdf(req: PdfRequest):
    try:
        pdf_bytes = generate_resume_pdf(req.text)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=optimized_resume.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/audit")
async def audit(req: TextRequest):
    try:
        return full_audit(req.resume_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Recruiter ATS Endpoints (Modules 1 - 5) ──

class JdParseRequest(BaseModel):
    jd_text: str = Field(..., min_length=20)


@app.post("/api/parse-jd")
async def parse_jd_endpoint(req: JdParseRequest):
    """Parse raw Job Description and return structured requirements."""
    try:
        return parse_job_description(req.jd_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/batch-rank")
async def batch_rank(
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    resumes: List[UploadFile] = File(...),
):
    """
    Module 1, 2, 3 & 4 Core Endpoint:
    Accepts 1 JD (text or file) and 10+ resumes (PDF/DOCX/TXT).
    Parses, scores with SentenceTransformers & NLP, and returns ranked candidates.
    """
    try:
        # 1. Resolve JD Text
        final_jd_text = ""
        if jd_file and jd_file.filename:
            content = await jd_file.read()
            parsed_text, _ = parse_file(content, jd_file.filename)
            final_jd_text = parsed_text
        elif jd_text and len(jd_text.strip()) > 10:
            final_jd_text = jd_text.strip()
        else:
            raise HTTPException(
                status_code=400,
                detail="Please provide a Job Description (paste text or upload a file)."
            )

        parsed_jd = parse_job_description(final_jd_text)

        # 2. Parse batch of resumes
        candidate_profiles = []
        parsing_errors = []

        for file in resumes:
            if not file.filename:
                continue
            try:
                content = await file.read()
                text, _ = parse_file(content, file.filename)
                profile = extract_candidate_profile(text, filename=file.filename)
                candidate_profiles.append(profile)
            except Exception as e:
                parsing_errors.append({"filename": file.filename, "error": str(e)})

        if not candidate_profiles:
            raise HTTPException(
                status_code=400,
                detail=f"None of the uploaded resumes could be parsed. Errors: {parsing_errors}"
            )

        # 3. Score & Rank candidates
        ranked_candidates = rank_candidates(candidate_profiles, parsed_jd)

        return {
            "success": True,
            "job_description": {
                "title": parsed_jd["title"],
                "experience": parsed_jd["experience"],
                "education": parsed_jd["education"],
                "mandatory_skills": parsed_jd["mandatory_skills"],
                "bonus_skills": parsed_jd["bonus_skills"],
                "total_skills": len(parsed_jd["all_skills"]),
                "responsibilities_text": parsed_jd.get("responsibilities_text", ""),
                "raw_text": parsed_jd.get("raw_text", ""),
            },
            "total_evaluated": len(ranked_candidates),
            "errors": parsing_errors,
            "candidates": ranked_candidates,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch evaluation error: {str(e)}")


class CandidateDemoItem(BaseModel):
    filename: Optional[str] = "Candidate.txt"
    text: str

class DemoBatchRequest(BaseModel):
    jd_text: str
    candidates: List[CandidateDemoItem]


@app.get("/api/sample-demo-data")
async def sample_demo_data():
    """
    Returns pre-loaded sample dataset (JD + 10 diverse candidates)
    for immediate 1-click recruiter demo during interviews.
    """
    import os
    sample_jd_path = os.path.join(os.path.dirname(__file__), "..", "sample_job_description.txt")
    sample_res_path = os.path.join(os.path.dirname(__file__), "..", "sample_resume.txt")

    jd_text = ""
    if os.path.exists(sample_jd_path):
        with open(sample_jd_path, "r", encoding="utf-8") as f:
            jd_text = f.read()

    res_text = ""
    if os.path.exists(sample_res_path):
        with open(sample_res_path, "r", encoding="utf-8") as f:
            res_text = f.read()

    return {
        "sample_jd": jd_text,
        "sample_resume": res_text,
    }


@app.post("/api/sample-demo-data")
async def sample_demo_data_post(req: DemoBatchRequest):
    """
    Module 3 & 4: Evaluates in-memory candidate texts against a JD.
    Instantly scores with vectorized SentenceTransformers.
    """
    import time
    start_t = time.time()
    try:
        parsed_jd = parse_job_description(req.jd_text)
        candidate_profiles = []
        for cand in req.candidates:
            profile = extract_candidate_profile(cand.text, filename=cand.filename)
            candidate_profiles.append(profile)

        ranked = rank_candidates(candidate_profiles, parsed_jd)
        elapsed = round(time.time() - start_t, 2)
        return {
            "success": True,
            "job_description": {
                "title": parsed_jd["title"],
                "experience": parsed_jd["experience"],
                "education": parsed_jd["education"],
                "mandatory_skills": parsed_jd["mandatory_skills"],
                "bonus_skills": parsed_jd["bonus_skills"],
                "total_skills": len(parsed_jd["all_skills"]),
                "responsibilities_text": parsed_jd.get("responsibilities_text", ""),
                "raw_text": parsed_jd.get("raw_text", ""),
            },
            "total_evaluated": len(ranked),
            "processing_time_seconds": elapsed,
            "candidates": ranked
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo evaluation error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
