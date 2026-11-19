# Launches the full-stack AI Resume Matching & Candidate Ranking ATS
# Backend: FastAPI (http://localhost:8000)
# Frontend: React Vite (http://localhost:5173)

$ProjectRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting AI Resume Matching & Candidate Ranking ATS     " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend in new process
Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$BackendCmd = "Set-Location -LiteralPath '$ProjectRoot\backend'; & '$ProjectRoot\.venv\Scripts\python.exe' -m uvicorn main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd

# 2. Start Frontend in new process
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
$FrontendCmd = "Set-Location -LiteralPath '$ProjectRoot\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd

Write-Host "`n✓ Full-stack services launched!" -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API / Swagger UI: http://localhost:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
