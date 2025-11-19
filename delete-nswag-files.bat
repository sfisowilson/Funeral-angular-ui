@echo off
echo ================================================================
echo  DELETE OLD NSWAG FILES
echo ================================================================
echo.

echo WARNING: This will permanently delete NSwag files!
echo.
echo Files to be deleted:
echo   - src\app\core\services\service-proxies.ts
echo   - src\app\core\services\service-proxies.spec.ts
echo   - src\nswag.json
echo.

set /p CONFIRM="Are you sure ALL components are migrated? (yes/no): "

if /i "%CONFIRM%"=="yes" (
    echo.
    echo Deleting NSwag files...
    
    if exist "src\app\core\services\service-proxies.ts" (
        del "src\app\core\services\service-proxies.ts"
        echo     [DELETED] service-proxies.ts
    ) else (
        echo     [NOT FOUND] service-proxies.ts
    )
    
    if exist "src\app\core\services\service-proxies.spec.ts" (
        del "src\app\core\services\service-proxies.spec.ts"
        echo     [DELETED] service-proxies.spec.ts
    ) else (
        echo     [NOT FOUND] service-proxies.spec.ts
    )
    
    if exist "src\nswag.json" (
        del "src\nswag.json"
        echo     [DELETED] nswag.json
    ) else (
        echo     [NOT FOUND] nswag.json
    )
    
    echo.
    echo ✅ NSwag files deleted!
    echo.
    echo Don't forget to commit:
    echo   git add .
    echo   git commit -m "Complete Orval migration - removed NSwag files"
    echo.
) else (
    echo.
    echo Deletion cancelled. No files were deleted.
    echo.
)

pause
