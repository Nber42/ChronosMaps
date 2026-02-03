@echo off
echo 🐘 Starting Database Setup...

cd /d "%~dp0"

echo 🐳 Starting Docker Containers...
docker compose up -d
if %errorlevel% neq 0 (
    echo ⚠️ 'docker compose' failed. Trying 'docker-compose'...
    docker-compose up -d
)

echo ⏳ Waiting for Database to be ready...
timeout /t 5 /nobreak

echo 🛠️ Generating Prisma Client...
cd packages\database
call npx prisma generate

echo 🚀 Running Migration...
call npx prisma migrate dev --name init

echo ✅ Database Ready!
pause
