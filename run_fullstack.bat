@echo off
echo ==========================================================
echo   Starting AI Resume Matching ^& Candidate Ranking ATS
echo ==========================================================

REM Start FastAPI Backend
echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start "ATS Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && "..\.venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000"

REM Start React Frontend
echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start "ATS Frontend (React)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ==========================================================
echo Services launched!
echo Frontend: http://localhost:5173
echo Backend Docs: http://localhost:8000/docs
echo ==========================================================
