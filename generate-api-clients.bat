@echo off
echo ============================================
echo  Orval API Client Generator
echo ============================================
echo.

REM Check if NodeAPI is running
echo Checking if NodeAPI is accessible...
curl -s http://localhost:3000/api-docs/swagger.json >nul 2>&1
if errorlevel 1 (
    echo [ERROR] NodeAPI is not running or not accessible at http://localhost:3000
    echo.
    echo Please start NodeAPI first:
    echo   cd ..\NodeAPI
    echo   npm run start:dev
    echo.
    pause
    exit /b 1
)

echo [OK] NodeAPI is accessible
echo.

echo Generating API clients with Orval...
call npm run generate:api

if errorlevel 1 (
    echo.
    echo [ERROR] Generation failed. Check the error messages above.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] API clients generated successfully!
echo.
echo Generated files are in:
echo   - src\app\core\models\
echo   - src\app\core\services\generated\
echo.
pause
