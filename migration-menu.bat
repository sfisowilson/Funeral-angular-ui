@echo off
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         ORVAL MIGRATION - MASTER MENU                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:MENU
echo.
echo  Select an option:
echo.
echo  [1] Complete Setup and Generate (First time setup)
echo  [2] Find Components to Migrate
echo  [3] Regenerate API Clients (After API changes)
echo  [4] Verify Migration Complete
echo  [5] Delete Old NSwag Files (When 100%% done)
echo  [6] Open Documentation
echo  [7] Exit
echo.
set /p CHOICE="Enter choice (1-7): "

if "%CHOICE%"=="1" goto SETUP
if "%CHOICE%"=="2" goto FIND
if "%CHOICE%"=="3" goto REGEN
if "%CHOICE%"=="4" goto VERIFY
if "%CHOICE%"=="5" goto DELETE
if "%CHOICE%"=="6" goto DOCS
if "%CHOICE%"=="7" goto END

echo Invalid choice. Please try again.
goto MENU

:SETUP
cls
echo Running complete setup...
echo.
call complete-setup.bat
goto MENU

:FIND
cls
echo Finding components that need migration...
echo.
call find-components-to-migrate.bat
goto MENU

:REGEN
cls
echo Regenerating API clients...
echo.
call regenerate-api.bat
goto MENU

:VERIFY
cls
echo Verifying migration status...
echo.
call verify-migration-complete.bat
goto MENU

:DELETE
cls
echo Preparing to delete NSwag files...
echo.
call delete-nswag-files.bat
goto MENU

:DOCS
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    DOCUMENTATION                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Available documentation files:
echo.
echo  Main Guides:
echo    - START_HERE.md
echo    - YOUR_NEXT_STEPS.md
echo    - INCREMENTAL_MIGRATION_PLAN.md (Step-by-step guide)
echo    - MIGRATION_CHEAT_SHEET.txt (Print this!)
echo.
echo  Detailed Guides:
echo    - QUICK_ACTION_GUIDE.md
echo    - SERVICE_PROXIES_REPLACEMENT_STRATEGY.md
echo    - SERVICE_MAPPING_GUIDE.md
echo.
echo  Reference:
echo    - ORVAL_IMPLEMENTATION_GUIDE.md
echo    - NSWAG_TO_ORVAL_MIGRATION.md
echo    - ORVAL_QUICK_REFERENCE.md
echo.
echo Open these files in your text editor or IDE.
echo.
pause
goto MENU

:END
echo.
echo Goodbye!
exit /b 0
