@echo off
echo 🚀 Starting Chronos Maps V2 Setup...

REM Check Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is NOT installed or not in PATH.
    echo Please install Node.js (v18+) from https://nodejs.org/
    pause
    exit /b
)

echo ✅ Node.js found.

cd /d "%~dp0"

REM Install Turbo Global (Optional but recommended)
echo 📦 Installing Turbo...
call npm install --global turbo

REM Scaffold Apps if they don't exist
if not exist "apps\api" (
    echo 🛠️ Scaffolding NestJS Backend...
    mkdir apps
    cd apps
    call npx --yes @nestjs/cli new api --package-manager npm --skip-git --strict --language ts
    cd ..
)

if not exist "apps\mobile" (
    echo 📱 Scaffolding Expo Native App...
    cd apps
    call npx --yes create-expo-app mobile --template blank-typescript --yes
    cd ..
)

REM Install Dependencies
echo 📥 Installing Monorepo Dependencies...
call npm install

echo ✨ Setup Complete! 
echo Run 'npm run dev' to start.
pause
