@echo off
REM =====================================================
REM Quick Setup & Launch - Blockchain Voting System
REM =====================================================
REM This script performs initial setup and launches all services
REM =====================================================

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul

cls
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     BLOCKCHAIN VOTING SYSTEM - QUICK SETUP & LAUNCH           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set PROJECT_ROOT=%~dp0
set FRONTEND_DIR=%PROJECT_ROOT%frontend
set NODEJS_DIR=%PROJECT_ROOT%node-ws
set BLOCKCHAIN_DIR=%PROJECT_ROOT%python-blockchain
set XAMPP_DIR=C:\xampp

echo Performing pre-launch setup...
echo.

REM =====================================================
REM Step 1: Check and Create .env Files
REM =====================================================
echo [STEP 1] Checking environment files...

if not exist "%FRONTEND_DIR%\.env" (
    echo Creating frontend\.env...
    (
        echo VITE_API_URL=http://localhost:8000/api/v1
        echo VITE_WS_URL=ws://localhost:3001
        echo VITE_BLOCKCHAIN_API_URL=http://localhost:5000
    ) > "%FRONTEND_DIR%\.env"
    echo ✓ Frontend .env created
) else (
    echo ✓ Frontend .env already exists
)

if not exist "%NODEJS_DIR%\.env" (
    echo Creating node-ws\.env...
    (
        echo NODE_ENV=development
        echo PORT=3001
        echo HOST=localhost
    ) > "%NODEJS_DIR%\.env"
    echo ✓ Node-ws .env created
) else (
    echo ✓ Node-ws .env already exists
)

if not exist "%BLOCKCHAIN_DIR%\.env" (
    echo Creating python-blockchain\.env...
    (
        echo APP_ENV=development
        echo HOST=0.0.0.0
        echo PORT=5000
        echo DEBUG=True
    ) > "%BLOCKCHAIN_DIR%\.env"
    echo ✓ Python-blockchain .env created
) else (
    echo ✓ Python-blockchain .env already exists
)

echo.

REM =====================================================
REM Step 2: Check Dependencies
REM =====================================================
echo [STEP 2] Checking required dependencies...
echo.

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not found! Please install from https://nodejs.org/
    echo.
    timeout /t 3 /nobreak
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js %%i installed
)

echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Python not found! Please install from https://www.python.org/
    echo Make sure to add Python to PATH during installation
    echo.
    timeout /t 3 /nobreak
) else (
    for /f "tokens=*" %%i in ('python --version') do echo ✓ Python %%i installed
)

echo Checking XAMPP/MySQL...
if exist "%XAMPP_DIR%\mysql\bin\mysqld.exe" (
    echo ✓ XAMPP found at %XAMPP_DIR%
) else (
    echo ✗ XAMPP not found at %XAMPP_DIR%
    echo Please install XAMPP from https://www.apachefriends.org/
    echo Or update XAMPP_DIR variable in this script
    echo.
    timeout /t 3 /nobreak
)

echo.

REM =====================================================
REM Step 3: Install Dependencies
REM =====================================================
echo [STEP 3] Installing/Updating dependencies...
echo.

if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        echo WARNING: Failed to install frontend dependencies
    ) else (
        echo ✓ Frontend dependencies installed
    )
    cd "%PROJECT_ROOT%"
) else (
    echo ✓ Frontend dependencies already installed
)

echo.

if not exist "%NODEJS_DIR%\node_modules" (
    echo Installing node-ws dependencies...
    cd "%NODEJS_DIR%"
    call npm install
    if errorlevel 1 (
        echo WARNING: Failed to install node-ws dependencies
    ) else (
        echo ✓ Node-ws dependencies installed
    )
    cd "%PROJECT_ROOT%"
) else (
    echo ✓ Node-ws dependencies already installed
)

echo.

if not exist "%BLOCKCHAIN_DIR%\venv" (
    echo Creating Python virtual environment...
    cd "%BLOCKCHAIN_DIR%"
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo WARNING: Failed to install Python dependencies
    ) else (
        echo ✓ Python environment setup
    )
    cd "%PROJECT_ROOT%"
) else (
    echo ✓ Python virtual environment already created
)

echo.

REM =====================================================
REM Step 4: Database Setup (Optional)
REM =====================================================
echo [STEP 4] Database Setup...
echo.
echo Database setup requires MySQL root password.
echo This is typically set during XAMPP installation.
echo.
echo Would you like to set up the database now? (Y/N)
set /p DB_SETUP="Enter your choice: "

if /i "%DB_SETUP%"=="Y" (
    echo Running database setup...
    if exist "%PROJECT_ROOT%\mysql-setup.bat" (
        call "%PROJECT_ROOT%\mysql-setup.bat"
    ) else (
        echo ERROR: mysql-setup.bat not found
    )
) else (
    echo Skipping database setup
    echo Note: You can run mysql-setup.bat later to set up the database
)

echo.

REM =====================================================
REM Step 5: Launch All Services
REM =====================================================
echo [STEP 5] Launching all services...
echo.
echo Starting all services. This will open multiple terminal windows.
echo.

if exist "%PROJECT_ROOT%\start-all-services.bat" (
    call "%PROJECT_ROOT%\start-all-services.bat"
) else (
    echo ERROR: start-all-services.bat not found
    pause
    exit /b 1
)

popd
endlocal
exit /b 0
