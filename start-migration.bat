@echo off
echo ================================================
echo  Orval Migration Helper
echo ================================================
echo.

REM Step 1: Create directories
echo [1/4] Creating output directories...
if not exist "src\app\core\models" mkdir "src\app\core\models"
if not exist "src\app\core\services\generated" mkdir "src\app\core\services\generated"
echo      - Created src\app\core\models
echo      - Created src\app\core\services\generated
echo.

REM Step 2: Check if API is running
echo [2/4] Checking if NodeAPI is running...
curl -s http://localhost:3000/api-docs/swagger.json >nul 2>&1
if errorlevel 1 (
    echo      [ERROR] NodeAPI is not accessible!
    echo.
    echo      Please start NodeAPI first:
    echo        cd ..\NodeAPI
    echo        npm run start:dev
    echo.
    pause
    exit /b 1
)
echo      [OK] NodeAPI is running
echo.

REM Step 3: Generate Orval files
echo [3/4] Generating Orval API clients...
call npm run generate:api
if errorlevel 1 (
    echo.
    echo      [ERROR] Generation failed!
    pause
    exit /b 1
)
echo.

REM Step 4: Show what was generated
echo [4/4] Generation complete!
echo.
echo Generated files:
echo   Models: src\app\core\models\
dir /b src\app\core\models\*.ts 2>nul
echo.
echo   Services: src\app\core\services\generated\
dir /b src\app\core\services\generated\*.ts 2>nul
echo.

REM Show comparison
echo ================================================
echo  COMPARISON
echo ================================================
echo.
echo OLD (NSwag):
echo   Location: src\app\core\services\service-proxies.ts
echo   Type: Single file with all services
echo   Size: 
for %%F in (src\app\core\services\service-proxies.ts) do echo     %%~zF bytes
echo.
echo NEW (Orval):
echo   Location: src\app\core\services\generated\
echo   Type: Multiple files (one per service)
echo   Services generated:
for /f %%F in ('dir /b src\app\core\services\generated\*.service.ts 2^>nul ^| find /c /v ""') do echo     %%F service files
echo.

REM Next steps
echo ================================================
echo  NEXT STEPS
echo ================================================
echo.
echo 1. Review generated files:
echo    - Check src\app\core\models\
echo    - Check src\app\core\services\generated\
echo.
echo 2. Choose migration strategy:
echo    Read: SERVICE_PROXIES_REPLACEMENT_STRATEGY.md
echo.
echo 3. Recommended: Incremental migration
echo    - Keep both service-proxies.ts and generated\
echo    - Migrate one module at a time
echo    - Test each module before next
echo.
echo 4. Start with simplest module
echo    - Find which module has fewest dependencies
echo    - Update imports to use generated services
echo    - Test thoroughly
echo.
echo ================================================
echo.
pause
