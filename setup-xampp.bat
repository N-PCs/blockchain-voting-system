@echo off
REM Blockchain Voting System - XAMPP Setup Script for Windows
REM This script helps set up the project to work with XAMPP

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul

echo ========================================
echo Blockchain Voting System - XAMPP Setup
echo ========================================
echo.

set XAMPP_DIR=C:\xampp
set PROJECT_DIR=%~dp0
set API_DIR=%XAMPP_DIR%\htdocs\voting-api

echo Checking XAMPP installation...
if not exist "%XAMPP_DIR%" (
    echo ERROR: XAMPP not found in %XAMPP_DIR%
    echo Please install XAMPP or update the XAMPP_DIR variable in this script
    pause
    popd >nul
    endlocal
    exit /b 1
)

echo XAMPP found at %XAMPP_DIR%
echo.

echo Creating API directory in XAMPP htdocs...
if not exist "%API_DIR%" (
    mkdir "%API_DIR%"
    echo Created %API_DIR%
) else (
    echo Directory already exists: %API_DIR%
)

echo.
echo Copying PHP backend files...
xcopy /E /I /Y "php-backend\*" "%API_DIR%\" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to copy PHP backend to "%API_DIR%".
    echo Ensure you have permissions and that "php-backend" exists.
    popd >nul
    endlocal
    exit /b 1
) else (
    echo PHP backend copied to %API_DIR%
)

echo.
echo Checking PHP version in XAMPP...
"%XAMPP_DIR%\php\php.exe" --version > temp_php_version.txt 2>&1
findstr /C:"PHP 8" temp_php_version.txt >nul 2>&1
if errorlevel 1 (
    echo WARNING: PHP 8.1+ recommended. Current version:
    type temp_php_version.txt
) else (
    echo PHP version OK
)
del temp_php_version.txt

echo.
echo Setting up environment files...

REM Setup PHP backend .env
if not exist "%API_DIR%\.env" (
    if exist "%API_DIR%\.env.example" (
        copy "%API_DIR%\.env.example" "%API_DIR%\.env" >nul 2>&1
        if errorlevel 1 (
            echo ERROR: Failed to create "%API_DIR%\.env"
            popd >nul
            endlocal
            exit /b 1
        )
        echo Created %API_DIR%\.env
        echo Please edit %API_DIR%\.env with your database credentials
    ) else (
        echo WARNING: "%API_DIR%\.env.example" not found
    )
) else (
    echo %API_DIR%\.env already exists
)

REM Setup Python blockchain .env
if not exist "python-blockchain\.env" (
    if exist "python-blockchain\.env.example" (
        copy "python-blockchain\.env.example" "python-blockchain\.env" >nul 2>&1
        echo Created python-blockchain\.env
    ) else (
        echo WARNING: python-blockchain\.env.example not found
    )
)

REM Setup Node.js WebSocket .env
if not exist "node-ws\.env" (
    if exist "node-ws\.env.example" (
        copy "node-ws\.env.example" "node-ws\.env" >nul 2>&1
        echo Created node-ws\.env
    ) else (
        echo WARNING: node-ws\.env.example not found
    )
)

REM Setup React frontend .env
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" >nul 2>&1
        echo Created frontend\.env
    ) else (
        echo WARNING: frontend\.env.example not found
    )
)

echo.
echo ========================================
echo Setup Summary
echo ========================================
echo.
echo 1. XAMPP Directory: %XAMPP_DIR%
echo 2. API Directory: %API_DIR%
echo 3. Project Directory: %PROJECT_DIR%
echo.
echo Next Steps:
echo -----------
echo 1. Start XAMPP Control Panel and start Apache + MySQL
echo 2. Open phpMyAdmin (http://localhost/phpmyadmin)
echo 3. Create database 'voting_system'
echo 4. Import database/schema.sql
echo 5. Edit %API_DIR%\.env with correct database credentials
echo 6. Run: cd %API_DIR% ^&^& composer install
echo 7. Run: cd python-blockchain ^&^& pip install -r requirements.txt
echo 8. Run: cd node-ws ^&^& npm install
echo 9. Run: cd frontend ^&^& npm install
echo.
echo Startup Commands:
echo -----------------
echo 1. Start XAMPP (Apache + MySQL)
echo 2. cd python-blockchain ^&^& python run.py
echo 3. cd node-ws ^&^& npm start
echo 4. cd frontend ^&^& npm run dev
echo.
echo Access URLs:
echo -----------
echo Frontend:    http://localhost:5173
echo API:         http://localhost/voting-api
echo phpMyAdmin:  http://localhost/phpmyadmin
echo Blockchain:  http://localhost:5000
echo WebSocket:   ws://localhost:3001
echo.
echo Default Admin Login:
echo Email: admin@votingsystem.com
echo Password: Admin123!
echo.
echo IMPORTANT: Change the default admin password immediately!
echo.
pause
popd >nul
endlocal
