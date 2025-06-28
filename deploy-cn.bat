@echo off
echo Git repository initialization script
echo =====================================
echo.

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git not found! Please install Git first.
    echo Download from: https://git-scm.com/
    pause
    exit /b 1
)

if not exist ".git" (
    echo Step 1: Initializing Git repository...
    git init
    git branch -M main
    echo Git repository created successfully!
    echo.
)

echo Step 2: Adding all files to Git...
git add .
echo Files added successfully!
echo.

echo Step 3: Committing code...
git commit -m "Initial commit: Sensor Monitor System"
echo Code committed successfully!
echo.

echo =====================================
echo NEXT STEPS - Please follow these:
echo =====================================
echo.
echo 1. Go to GitHub.com and create new repository
echo    Repository name: sensor-monitor
echo    Make it PUBLIC
echo    Do NOT add README, .gitignore, or license
echo.
echo 2. Copy your repository URL from GitHub
echo    Example: https://github.com/USERNAME/sensor-monitor.git
echo.
echo 3. Run these commands in this folder:
echo    git remote add origin YOUR_REPO_URL
echo    git push -u origin main
echo.
echo 4. Deploy to Vercel:
echo    - Go to vercel.com
echo    - Login with GitHub
echo    - Click "New Project"
echo    - Select your sensor-monitor repository
echo    - Click Deploy
echo.
echo =====================================
echo Press any key to continue...
pause >nul
