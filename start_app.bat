@echo off
echo 🚀 Iniciando Chronos Maps...
echo.

:: Start the Python server in a new window
echo 💾 Iniciando servidor de persistencia en el puerto 8000...
start "Chronos Maps Server" cmd /c "python server.py"

:: Wait a moment for the server to initialize
timeout /t 2 /nobreak > nul

:: Open the index.html via the HTTP server
echo 🌍 Abriendo la aplicación en el navegador...
start http://localhost:8000/index.html

echo.
echo ✅ Todo listo. Si el navegador no se abre automáticamente, ve a: http://localhost:8000
echo.
pause
