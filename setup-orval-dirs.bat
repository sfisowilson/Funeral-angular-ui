@echo off
echo Creating directories for Orval generated files...

if not exist "src\app\core\models" (
    mkdir "src\app\core\models"
    echo Created src\app\core\models
)

if not exist "src\app\core\services\generated" (
    mkdir "src\app\core\services\generated"
    echo Created src\app\core\services\generated
)

echo.
echo Orval setup complete!
echo.
echo To generate API clients:
echo 1. Start your NodeAPI: cd ..\NodeAPI ^&^& npm run start:dev
echo 2. Run: npm run generate:api
echo.
pause
