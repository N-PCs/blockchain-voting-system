@echo off
REM =====================================================
REM Stop All Services - Blockchain Voting System
REM =====================================================
REM This script stops all running services
REM =====================================================

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul

cls
color 0C

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║        BLOCKCHAIN VOTING SYSTEM - STOP ALL SERVICES            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set XAMPP_DIR=C:\xampp

echo Stopping all services...
echo.

REM Stop React Frontend
echo [1/4] Stopping React Frontend (Port 3000)...
netstat -ano | findstr :3000 >nul
if errorlevel 1 (
    echo ✓ React Frontend is not running
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
    echo ✓ React Frontend stopped
)
echo.

REM Stop Node.js WebSocket Server
echo [2/4] Stopping Node.js WebSocket (Port 3001)...
netstat -ano | findstr :3001 >nul
if errorlevel 1 (
    echo ✓ Node.js WebSocket is not running
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
    echo ✓ Node.js WebSocket stopped
)
echo.

REM Stop Python Blockchain Service
echo [3/4] Stopping Python Blockchain (Port 5000)...
netstat -ano | findstr :5000 >nul
if errorlevel 1 (
    echo ✓ Python Blockchain is not running
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /PID %%a /F >nul 2>&1
    echo ✓ Python Blockchain stopped
)
echo.

REM Stop Apache
echo [4/4] Stopping Apache (Port 80)...
if exist "%XAMPP_DIR%\apache\bin\httpd.exe" (
    "%XAMPP_DIR%\apache\bin\httpd.exe" -k stop >nul 2>&1
    timeout /t 1 /nobreak >nul
    echo ✓ Apache stopped
) else (
    echo WARNING: Apache not found
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo ✓ All services have been stopped!
echo.
echo To restart services, run: start-all-services.bat
echo.
echo ════════════════════════════════════════════════════════════════
echo.

pause

popd
endlocal
exit /b 0
