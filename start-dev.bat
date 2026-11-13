@echo off
setlocal
set "ROOT=%~dp0"

echo Starting GovGuide full-stack development environment...
echo.

REM 1. Start Express + MongoDB Backend (Port 5000)
start "GovGuide Backend (Port 5000)" /D "%ROOT%backend" cmd /k "npm run dev"

REM 2. Start FastAPI AI Services (Port 8000) using local venv/.venv if present
start "GovGuide AI Services (Port 8000)" /D "%ROOT%ai-services" cmd /k "if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) else if exist venv\Scripts\python.exe (venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) else (python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload)"

REM 3. Start Vite React Frontend (Port 5173)
start "GovGuide Frontend (Port 5173)" /D "%ROOT%frontend" cmd /k "npm run dev"

echo Launched:
echo   Backend:     http://localhost:5000
echo   AI Services: http://127.0.0.1:8000
echo   Frontend:    http://localhost:5173
endlocal

