@echo off
echo ========================================
echo   CHRONOS MAPS - RELEASE PACKAGER
echo ========================================
echo.

set RELEASE_NAME=chronos-maps-v2.0
set RELEASE_DIR=release\%RELEASE_NAME%

echo Creating release directory...
if exist release rmdir /s /q release
mkdir %RELEASE_DIR%

echo Copying core files...
copy *.html %RELEASE_DIR%\
copy *.css %RELEASE_DIR%\
copy *.js %RELEASE_DIR%\
copy *.py %RELEASE_DIR%\
copy *.bat %RELEASE_DIR%\
copy *.md %RELEASE_DIR%\
copy .gitignore %RELEASE_DIR%\

echo Creating API_OPENAI.txt template...
echo YOUR_OPENAI_API_KEY_HERE > %RELEASE_DIR%\API_OPENAI.txt

echo.
echo ========================================
echo   Release package created!
echo   Location: %RELEASE_DIR%
echo ========================================
echo.
echo Next steps:
echo 1. Edit API_OPENAI.txt with your real key
echo 2. Configure Google Maps key in index.html
echo 3. Run start_app.bat to launch
echo.
pause
