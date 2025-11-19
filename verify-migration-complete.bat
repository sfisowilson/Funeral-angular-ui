@echo off
echo ================================================================
echo  VERIFY MIGRATION COMPLETE
echo ================================================================
echo.

cd src

echo Checking for remaining NSwag imports...
echo.

set REMAINING_COUNT=0

for /r %%f in (*.ts) do (
    if not "%%~nxf"=="service-proxies.ts" (
        findstr /m "service-proxies" "%%f" >nul 2>&1
        if not errorlevel 1 (
            set /a REMAINING_COUNT+=1
            echo [!REMAINING_COUNT!] %%~nxf still imports service-proxies
            echo     Path: %%f
            echo.
        )
    )
)

echo.
echo ================================================================
echo VERIFICATION RESULTS
echo ================================================================

if %REMAINING_COUNT% EQU 0 (
    echo.
    echo ✅ SUCCESS! No components are using service-proxies anymore!
    echo.
    echo You can now safely:
    echo 1. Delete src\app\core\services\service-proxies.ts
    echo 2. Delete src\app\core\services\service-proxies.spec.ts
    echo 3. Delete src\nswag.json
    echo.
    echo Run: delete-nswag-files.bat to remove old files
    echo.
) else (
    echo.
    echo ⚠️  WARNING: %REMAINING_COUNT% file(s) still using service-proxies
    echo.
    echo These files need to be migrated before you can remove NSwag.
    echo Continue migrating components one by one.
    echo.
)

pause
