@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo  ORVAL COMPLETE SETUP AND GENERATION
echo ================================================================
echo.

REM Step 1: Create directories
echo [1/3] Creating output directories...
if not exist "src\app\core\models" (
    mkdir "src\app\core\models"
    echo     [CREATED] src\app\core\models
) else (
    echo     [EXISTS] src\app\core\models
)

if not exist "src\app\core\services\generated" (
    mkdir "src\app\core\services\generated"
    echo     [CREATED] src\app\core\services\generated
) else (
    echo     [EXISTS] src\app\core\services\generated
)
echo.

REM Step 2: Generate Orval API clients
echo [2/3] Generating Orval API clients...
echo     This may take 10-30 seconds...
echo.
call npm run generate:api
if errorlevel 1 (
    echo.
    echo     [ERROR] Generation failed!
    echo     Check the error messages above.
    echo.
    pause
    exit /b 1
)
echo.

REM Step 3: Verify generation
echo [3/3] Verifying generated files...
echo.

set MODEL_COUNT=0
set SERVICE_COUNT=0

for %%f in (src\app\core\models\*.ts) do set /a MODEL_COUNT+=1
for %%f in (src\app\core\services\generated\*.ts) do set /a SERVICE_COUNT+=1

if %MODEL_COUNT% GTR 0 (
    echo     [SUCCESS] Generated %MODEL_COUNT% model files
) else (
    echo     [WARNING] No model files found
)

if %SERVICE_COUNT% GTR 0 (
    echo     [SUCCESS] Generated %SERVICE_COUNT% service files
) else (
    echo     [WARNING] No service files found
)

echo.
echo ================================================================
echo  GENERATION COMPLETE
echo ================================================================
echo.

REM Show what was generated
echo Generated Files:
echo.
echo Models (src\app\core\models\):
dir /b src\app\core\models\*.ts 2>nul | findstr /v /c:"index.ts" | more
echo     + index.ts (barrel export)
echo.
echo Services (src\app\core\services\generated\):
dir /b src\app\core\services\generated\*.ts 2>nul | findstr /v /c:"index.ts" | more
echo     + index.ts (barrel export)
echo.

REM Create migration tracking file if it doesn't exist
if not exist "src\app\core\services\MIGRATION_PROGRESS.md" (
    echo Creating migration tracking file...
    (
        echo # Orval Migration Progress
        echo.
        echo ## Generated: %date% %time%
        echo.
        echo ## Migration Status
        echo.
        echo ### ✅ Completed (Using Orval^)
        echo - None yet
        echo.
        echo ### 🔄 In Progress
        echo - [Component you're currently migrating]
        echo.
        echo ### ⏳ Not Started (Still using NSwag^)
        echo - All components
        echo.
        echo ## Services Available
        echo.
        for %%f in (src\app\core\services\generated\*.service.ts) do (
            set filename=%%~nf
            set servicename=!filename:.service=!
            echo - [ ] !servicename!
        )
        echo.
        echo ## Notes
        echo - Review INCREMENTAL_MIGRATION_PLAN.md for step-by-step guide
        echo - Use MIGRATION_CHEAT_SHEET.txt as quick reference
        echo - Migrate one component at a time
        echo - Test thoroughly after each migration
        echo - Commit after each successful migration
    ) > "src\app\core\services\MIGRATION_PROGRESS.md"
    echo     [CREATED] src\app\core\services\MIGRATION_PROGRESS.md
    echo.
)

echo ================================================================
echo  NEXT STEPS
echo ================================================================
echo.
echo 1. Review generated files in:
echo    - src\app\core\models\
echo    - src\app\core\services\generated\
echo.
echo 2. Read the migration plan:
echo    - Open: INCREMENTAL_MIGRATION_PLAN.md
echo    - Start at Phase 4: Choose Your First Component
echo.
echo 3. Keep this handy while working:
echo    - Print: MIGRATION_CHEAT_SHEET.txt
echo.
echo 4. Track your progress:
echo    - Update: src\app\core\services\MIGRATION_PROGRESS.md
echo.
echo 5. Your current structure:
echo    ├── service-proxies.ts (OLD - NSwag - Keep for now!)
echo    └── generated\ (NEW - Orval - Use in new components)
echo.
echo ================================================================
echo.
pause
