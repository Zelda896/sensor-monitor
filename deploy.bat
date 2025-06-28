@echo off
chcp 65001 >nul
echo Initializing Git repository and preparing for GitHub deployment...
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git not found, please install Git first
    echo Download: https://git-scm.com/
    pause
    exit /b 1
)

REM Initialize Git repository
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git branch -M main
)

REM Add all files
echo Adding files to Git...
git add .

REM Commit code
echo Committing code...
git commit -m "Initial commit: Sensor Monitor System"

echo.
echo ========================================
echo Git repository initialized successfully!
echo.
echo Next steps:
echo.
echo 1. Create new repository 'sensor-monitor' on GitHub
echo 2. Copy repository URL, example: https://github.com/YOUR_USERNAME/sensor-monitor.git
echo 3. Run these commands to push code:
echo    git remote add origin YOUR_REPO_URL
echo    git push -u origin main
echo.
echo 4. Visit https://vercel.com to deploy project
echo 5. Select your GitHub repository for deployment
echo.
echo ========================================
pause
