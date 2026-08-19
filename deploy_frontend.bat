@echo off
echo ======================================================================
echo           SocialGuard — Deploy Frontend to Firebase Hosting
echo ======================================================================
echo.
set RENDER_URL=https://final-year-project-l7us.onrender.com
set /p USER_URL="Enter your Render backend URL [Default: %RENDER_URL%]: "
if not "%USER_URL%"=="" set RENDER_URL=%USER_URL%

:: Strip trailing slash if present
if "%RENDER_URL:~-1%"=="/" set RENDER_URL=%RENDER_URL:~0,-1%

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
