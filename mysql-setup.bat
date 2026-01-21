@echo off
REM MySQL Setup Script for Blockchain Voting System
REM This script helps set up MySQL database and user for the voting system

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul

echo ========================================
echo MySQL Setup for Blockchain Voting System
echo ========================================
echo.

echo This script will help you set up MySQL for the voting system.
echo.

echo.
echo Setting up database and user...

echo You will be prompted for your MySQL root password by the MySQL client.
echo.

set "SQL_FILE=%TEMP%\voting_system_mysql_setup_%RANDOM%.sql"
> "%SQL_FILE%" (
    echo CREATE DATABASE IF NOT EXISTS voting_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    echo CREATE USER IF NOT EXISTS 'voting_user'^@'localhost' IDENTIFIED BY 'voting_user_pass';
    echo GRANT ALL PRIVILEGES ON voting_system.* TO 'voting_user'^@'localhost';
    echo FLUSH PRIVILEGES;
)

mysql -u root -p < "%SQL_FILE%"
set "MYSQL_EXIT=%ERRORLEVEL%"
del "%SQL_FILE%" >nul 2>&1

if %MYSQL_EXIT% EQU 0 (
    echo.
    echo MySQL setup completed successfully!
    echo.
    echo Database: voting_system
    echo User: voting_user
    echo Password: voting_user_pass
    echo.
    echo You can now run: setup-database.bat
) else (
    echo.
    echo ERROR: MySQL setup failed. Please check your password and try again.
)

echo.
pause

popd >nul
endlocal