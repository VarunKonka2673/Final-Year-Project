@echo off
echo ======================================================================
echo           SocialGuard — AI Fraudulent Account Detection
echo ======================================================================
echo Starting FastAPI Backend and Vite React Frontend...

start "SocialGuard Backend" cmd /k ".\venv\Scripts\uvicorn backend.api.app:app --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul
start "SocialGuard Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo SocialGuard is active:
echo   - Frontend UI:  http://localhost:5173/
echo   - Backend Docs: http://127.0.0.1:8000/docs
echo ======================================================================
pause
