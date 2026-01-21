@echo off
REM Blockchain Voting System - Complete Windows Setup Script
REM This script sets up the entire project for Windows without Docker

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul

echo ========================================
echo Blockchain Voting System - Windows Setup
echo ========================================
echo.

REM Check if XAMPP is installed
set XAMPP_DIR=C:\xampp
if not exist "%XAMPP_DIR%" (
    echo WARNING: XAMPP not found in %XAMPP_DIR%
    echo Please install XAMPP from https://www.apachefriends.org/
    echo Or update the XAMPP_DIR variable in this script
    echo.
    echo Continuing with setup assuming XAMPP will be installed later...
) else (
    echo XAMPP found at %XAMPP_DIR%
)

echo.
echo Setting up environment files...

REM Setup PHP backend .env
if not exist "php-backend\.env" (
    if exist "php-backend\.env.example" (
        copy "php-backend\.env.example" "php-backend\.env" >nul
        echo Created php-backend\.env
        echo Please edit php-backend\.env with your database credentials
    ) else (
        echo WARNING: php-backend\.env.example not found
    )
) else (
    echo php-backend\.env already exists
)

REM Setup Python blockchain .env
if not exist "python-blockchain\.env" (
    if exist "python-blockchain\.env.example" (
        copy "python-blockchain\.env.example" "python-blockchain\.env" >nul
        echo Created python-blockchain\.env
    ) else (
        echo WARNING: python-blockchain\.env.example not found
    )
)

REM Setup Node.js WebSocket .env
if not exist "node-ws\.env" (
    if exist "node-ws\.env.example" (
        copy "node-ws\.env.example" "node-ws\.env" >nul
        echo Created node-ws\.env
    ) else (
        echo WARNING: node-ws\.env.example not found
    )
)

REM Setup React frontend .env
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" >nul
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
echo Environment files created. Please edit them with your configuration:
echo - php-backend\.env (database credentials)
echo - python-blockchain\.env
echo - node-ws\.env
echo - frontend\.env
echo.
echo Next Steps:
echo -----------
echo Choose one of the following database setups:
echo.
echo Option 1 - XAMPP (Easiest):
echo 1. Start XAMPP Control Panel and start Apache + MySQL
echo 2. Open phpMyAdmin (http://localhost/phpmyadmin)
echo 3. Create database 'voting_system' and import database/schema.sql
echo 4. Run: setup-database.bat
echo.
echo Option 2 - Standalone MySQL (Advanced):
echo 1. Ensure MySQL service is running (net start MySQL96)
echo 2. Run: mysql-setup.bat (enter your MySQL root password)
echo 3. Run: setup-database.bat
echo 5. Install PHP dependencies: cd php-backend ^&^& composer install
echo 6. Install Python dependencies: cd python-blockchain ^&^& pip install -r requirements.txt
echo 7. Install Node.js dependencies: cd node-ws ^&^& npm install
echo 8. Install frontend dependencies: cd frontend ^&^& npm install
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
echo API:         http://localhost/voting-api (when using XAMPP)
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