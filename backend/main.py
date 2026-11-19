"""
main.py — FastAPI backend: Enterprise AI Resume Matching & Candidate Ranking ATS.
Powered by SentenceTransformers (dense semantic similarity) and Multi-Factor NLP.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uvicorn
import os
import time

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

from file_parser import parse_file
from candidate_extractor import extract_candidate_profile
from jd_parser import parse_job_description
from batch_scorer import rank_candidates

app = FastAPI(
    title="AI Resume Matching & Candidate Ranking ATS API",
    description="Enterprise ATS engine for automated resume parsing, semantic embedding matching, and candidate ranking.",
    version="3.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──

class JdParseRequest(BaseModel):
    jd_text: str = Field(..., min_length=20)

class CandidateDemoItem(BaseModel):
    filename: Optional[str] = "Candidate.txt"
    text: str

class DemoBatchRequest(BaseModel):
    jd_text: str
    candidates: List[CandidateDemoItem]


# ── Endpoints ──

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Root ping endpoint for monitors and health checks."""
    return {"status": "ok", "service": "Candidate Ranking ATS Engine", "docs": "/docs"}


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health():
    """System health check endpoint."""
    return {
        "status": "ok",
        "engine": "SentenceTransformers + Multi-Factor NLP",
        "semantic_model": "all-MiniLM-L6-v2",
        "database": "In-Memory Dynamic Requisitions",
    }


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    """Upload PDF, DOCX, or TXT file and extract raw text."""
    try:
        content = await file.read()
        text, ftype = parse_file(content, file.filename)
        return {
            "text": text,
            "filename": file.filename,
            "type": ftype,
            "chars": len(text)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File error: {str(e)}")


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
    Core Batch Evaluation Endpoint (Modules 1–5):
    Ingests 1 Job Description (text or file) and 10+ candidate resumes (PDF/DOCX/TXT).
    Parses profiles, computes multi-factor AI scores, and returns ranked candidates.
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

        # 2. Parse batch of candidate resumes
        candidate_profiles = []
        parsing_errors = []

        for file in resumes:
            if not file.filename:
                continue
            try:
                content = await file.read()
                # Persist original file bytes to allow downloading in native format (.pdf, .docx, .txt)
                safe_name = os.path.basename(file.filename)
                save_path = os.path.join(UPLOAD_DIR, safe_name)
                with open(save_path, "wb") as f_out:
                    f_out.write(content)

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

        # 3. Score & Rank candidates using Multi-Factor AI Engine
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


@app.post("/api/sample-demo-data")
async def sample_demo_data_post(req: DemoBatchRequest):
    """
    1-Click Recruiter Demo Evaluation:
    Evaluates candidate text profiles against a target Job Description.
    Scores instantly with vectorized SentenceTransformers and returns ranked results.
    """
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


@app.get("/api/download-resume/{filename}")
async def download_resume(filename: str):
    """Serve resume in its original format (.pdf, .docx, .txt)."""
    # 1. Check uploads directory
    candidate_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.isfile(candidate_path):
        return FileResponse(path=candidate_path, filename=filename, media_type="application/octet-stream")

    # 2. Check test_resumes directory
    base_dir = os.path.dirname(os.path.dirname(__file__))
    test_path = os.path.join(base_dir, "test_resumes", filename)
    if os.path.isfile(test_path):
        return FileResponse(path=test_path, filename=filename, media_type="application/octet-stream")

    raise HTTPException(status_code=404, detail="Original resume file not found.")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
