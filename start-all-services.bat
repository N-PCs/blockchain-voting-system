@echo off
REM =====================================================
REM Blockchain Voting System - Master Service Launcher
REM =====================================================
REM This script starts all required services:
REM 1. MySQL Database
REM 2. PHP Backend (Apache)
REM 3. Python Blockchain Service
REM 4. Node.js WebSocket Server
REM 5. React Frontend (Dev Server)
REM =====================================================

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul

REM Colors and formatting
cls
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     BLOCKCHAIN VOTING SYSTEM - MASTER SERVICE LAUNCHER        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Starting all services... This will open multiple windows.
echo.
echo Services to be started:
echo  1. MySQL Database
echo  2. PHP Backend (Apache + PHP)
echo  3. Python Blockchain Service (Port 5000)
echo  4. Node.js WebSocket Server (Port 3001)
echo  5. React Frontend Development Server (Port 3000)
echo.
echo ════════════════════════════════════════════════════════════════
echo.

REM Define paths
set PROJECT_ROOT=%~dp0
set FRONTEND_DIR=%PROJECT_ROOT%frontend
set BACKEND_DIR=%PROJECT_ROOT%php-backend
set BLOCKCHAIN_DIR=%PROJECT_ROOT%python-blockchain
set NODEJS_DIR=%PROJECT_ROOT%node-ws
set DB_DIR=%PROJECT_ROOT%database
set XAMPP_DIR=C:\xampp

REM Verify critical directories exist
echo Verifying project structure...
if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found at %FRONTEND_DIR%
    echo.
    pause
    exit /b 1
)
if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found at %BACKEND_DIR%
    echo.
    pause
    exit /b 1
)
if not exist "%BLOCKCHAIN_DIR%" (
    echo ERROR: Blockchain directory not found at %BLOCKCHAIN_DIR%
    echo.
    pause
    exit /b 1
)
if not exist "%NODEJS_DIR%" (
    echo ERROR: Node.js directory not found at %NODEJS_DIR%
    echo.
    pause
    exit /b 1
)

echo ✓ All project directories verified
echo.

REM =====================================================
REM 1. Start MySQL Database
REM =====================================================
echo.
echo [1/5] Starting MySQL Database...
echo ────────────────────────────────────────────────────────────────

if exist "%XAMPP_DIR%\mysql\bin\mysqld.exe" (
    echo Starting XAMPP MySQL service...
    
    REM Check if MySQL is already running
    netstat -ano | find "3306" >nul
    if errorlevel 1 (
        REM Start MySQL
        "%XAMPP_DIR%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP_DIR%\mysql\bin\my.ini" >nul 2>&1 &
        timeout /t 3 /nobreak >nul
        echo ✓ MySQL started on port 3306
    ) else (
        echo ✓ MySQL already running on port 3306
    )
) else (
    echo WARNING: XAMPP/MySQL not found at %XAMPP_DIR%
    echo Please ensure XAMPP is installed at C:\xampp
    echo Or update the XAMPP_DIR variable in this script
)

echo.

REM =====================================================
REM 2. Start PHP Backend (Apache)
REM =====================================================
echo.
echo [2/5] Starting PHP Backend (Apache + PHP)...
echo ────────────────────────────────────────────────────────────────

if exist "%XAMPP_DIR%\apache\bin\httpd.exe" (
    echo Starting XAMPP Apache service...
    
    REM Check if Apache is already running
    netstat -ano | find "80" >nul
    if errorlevel 1 (
        REM Start Apache
        "%XAMPP_DIR%\apache\bin\httpd.exe" -k start >nul 2>&1
        timeout /t 2 /nobreak >nul
        echo ✓ Apache started on port 80
        echo ✓ PHP Backend accessible at http://localhost/api/v1
    ) else (
        echo ✓ Apache already running on port 80
    )
) else (
    echo WARNING: XAMPP/Apache not found at %XAMPP_DIR%
    echo Please ensure XAMPP is installed
)

echo.

REM =====================================================
REM 3. Start Python Blockchain Service
REM =====================================================
echo.
echo [3/5] Starting Python Blockchain Service...
echo ────────────────────────────────────────────────────────────────

if exist "%BLOCKCHAIN_DIR%\run.py" (
    echo Checking Python installation...
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python is not installed or not in PATH
        echo Please install Python 3.8+ from https://www.python.org/
        echo Make sure to check "Add Python to PATH" during installation
    ) else (
        echo Starting Python Blockchain Service...
        start "Blockchain Service (Python:5000)" cmd /k ^
            cd "%BLOCKCHAIN_DIR%" ^& ^
            if not exist venv ( ^
                echo Creating virtual environment... ^& ^
                python -m venv venv ^& ^
                call venv\Scripts\activate.bat ^& ^
                pip install -r requirements.txt ^
            ) else ( ^
                call venv\Scripts\activate.bat ^
            ) ^& ^
            python run.py
        
        timeout /t 2 /nobreak >nul
        echo ✓ Python Blockchain Service will start in new window (Port 5000)
    )
) else (
    echo ERROR: run.py not found in %BLOCKCHAIN_DIR%
)

echo.

REM =====================================================
REM 4. Start Node.js WebSocket Server
REM =====================================================
echo.
echo [4/5] Starting Node.js WebSocket Server...
echo ────────────────────────────────────────────────────────────────

if exist "%NODEJS_DIR%\package.json" (
    echo Checking Node.js installation...
    node --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js from https://nodejs.org/
    ) else (
        echo Starting Node.js WebSocket Server...
        start "WebSocket Server (Node:3001)" cmd /k ^
            cd "%NODEJS_DIR%" ^& ^
            if not exist node_modules ( ^
                echo Installing dependencies... ^& ^
                npm install ^
            ) ^& ^
            npm start
        
        timeout /t 2 /nobreak >nul
        echo ✓ Node.js WebSocket Server will start in new window (Port 3001)
    )
) else (
    echo ERROR: package.json not found in %NODEJS_DIR%
)

echo.

REM =====================================================
REM 5. Start React Frontend Development Server
REM =====================================================
echo.
echo [5/5] Starting React Frontend Development Server...
echo ────────────────────────────────────────────────────────────────

if exist "%FRONTEND_DIR%\package.json" (
    echo Checking Node.js installation...
    node --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js from https://nodejs.org/
    ) else (
        echo Starting React Frontend Development Server...
        start "React Frontend (Port 3000)" cmd /k ^
            cd "%FRONTEND_DIR%" ^& ^
            if not exist node_modules ( ^
                echo Installing dependencies... ^& ^
                npm install ^
            ) ^& ^
            npm run dev
        
        timeout /t 3 /nobreak >nul
        echo ✓ React Frontend will start in new window (Port 3000)
    )
) else (
    echo ERROR: package.json not found in %FRONTEND_DIR%
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo ✓ All services have been launched!
echo.
echo Access the application:
echo ────────────────────────────────────────────────────────────────
echo Frontend:       http://localhost:3000
echo Backend API:    http://localhost/api/v1
echo Blockchain:     http://localhost:5000
echo WebSocket:      ws://localhost:3001
echo PHP Admin:      http://localhost/phpmyadmin
echo ════════════════════════════════════════════════════════════════
echo.
echo Service Details:
echo ────────────────────────────────────────────────────────────────
echo 1. MySQL Database:            Port 3306 (Status: Running)
echo 2. PHP Backend (Apache):       Port 80
echo 3. Python Blockchain:          Port 5000 (in separate window)
echo 4. Node.js WebSocket:          Port 3001 (in separate window)
echo 5. React Frontend:             Port 3000 (in separate window)
echo ════════════════════════════════════════════════════════════════
echo.
echo Default Credentials:
echo ────────────────────────────────────────────────────────────────
echo Database User:     voting_user
echo Database Pass:     voting_user_pass
echo Database:         voting_system
echo Admin User:        admin@example.com (setup required)
echo ════════════════════════════════════════════════════════════════
echo.
echo IMPORTANT NOTES:
echo ────────────────────────────────────────────────────────────────
echo • New terminal windows will open for Blockchain, WebSocket, and Frontend
echo • Close any window to stop that service
echo • All windows will remain open for monitoring and debugging
echo • Check browser console (F12) for any client-side errors
echo • Logs will appear in each service window for troubleshooting
echo.
echo To stop all services:
echo  1. Close each terminal window (Ctrl+C or close button)
echo  2. Or use XAMPP Control Panel to stop MySQL and Apache
echo.
echo ════════════════════════════════════════════════════════════════
echo.

pause
echo.
echo Script completed. Services are now running in separate windows.
echo Keep this window and all service windows open for the application to function.
echo.

popd
endlocal
exit /b 0
