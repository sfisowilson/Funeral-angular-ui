@echo off
echo ================================================================
echo  FIND ALL COMPONENTS USING NSWAG
echo ================================================================
echo.

cd src

echo Searching for components that import from service-proxies...
echo.

set COMPONENT_COUNT=0

for /r %%f in (*.component.ts) do (
    findstr /m "service-proxies" "%%f" >nul 2>&1
    if not errorlevel 1 (
        set /a COMPONENT_COUNT+=1
        echo [!COMPONENT_COUNT!] %%~nxf
        echo     Path: %%f
        echo     Imports: 
        findstr "from.*service-proxies" "%%f" | findstr /v "^//"
        echo.
    )
)

echo.
echo ================================================================
echo SUMMARY
echo ================================================================
echo Total components using NSwag: %COMPONENT_COUNT%
echo.
echo These components need to be migrated to use Orval.
echo See INCREMENTAL_MIGRATION_PLAN.md for step-by-step guide.
echo.
pause
