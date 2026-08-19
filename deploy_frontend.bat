@echo off
echo ======================================================================
echo           SocialGuard — Deploy Frontend to Firebase Hosting
echo ======================================================================
echo.
set /p RENDER_URL="Enter your Render backend URL (e.g. https://socialguard-backend.onrender.com): "
if "%RENDER_URL%"=="" (
    echo Error: Render backend URL is required.
    pause
    exit /b 1
)

echo.
echo Writing environment configuration...
echo VITE_API_URL=%RENDER_URL% > frontend\.env.production

echo.
echo Building React frontend for production...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: React build failed.
    pause
    exit /b 1
)
cd ..

echo.
echo Deploying static files to Firebase Hosting...
call firebase deploy --only hosting
if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Firebase deployment failed.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo SocialGuard Frontend successfully deployed to Firebase Hosting!
echo ======================================================================
pause
