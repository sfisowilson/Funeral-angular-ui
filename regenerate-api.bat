@echo off
echo ================================================================
echo  REGENERATE ORVAL API CLIENTS
echo ================================================================
echo.
echo Use this script whenever your NodeAPI changes.
echo.

REM Check if API is accessible
echo Checking if NodeAPI is running...
curl -s http://localhost:3000/api-docs/swagger.json >nul 2>&1
if errorlevel 1 (
    echo [ERROR] NodeAPI is not accessible at http://localhost:3000
    echo.
    echo Please ensure NodeAPI is running:
    echo   cd ..\NodeAPI
    echo   npm run start:dev
    echo.
    pause
    exit /b 1
)
echo [OK] NodeAPI is accessible
echo.

echo Regenerating API clients...
call npm run generate:api

if errorlevel 1 (
    echo.
    echo [ERROR] Generation failed!
    pause
    exit /b 1
)

echo.
echo ================================================================
echo  REGENERATION COMPLETE
echo ================================================================
echo.

REM Count files
set MODEL_COUNT=0
set SERVICE_COUNT=0
for %%f in (src\app\core\models\*.ts) do set /a MODEL_COUNT+=1
for %%f in (src\app\core\services\generated\*.ts) do set /a SERVICE_COUNT+=1

echo Generated:
echo   - %MODEL_COUNT% model files
echo   - %SERVICE_COUNT% service files
echo.

echo Next steps:
echo   1. Check for any new services/models
echo   2. Update components that use changed APIs
echo   3. Test affected components
echo   4. Commit changes
echo.

pause
