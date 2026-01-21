@echo off
REM Blockchain Voting System - Database Setup Script for Windows
REM This script sets up the MySQL database for the voting system

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul

echo ========================================
echo Blockchain Voting System - Database Setup
echo ========================================
echo.

REM Configuration - Change these values as needed
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=3307
if "%DB_NAME%"=="" set DB_NAME=voting_system
if "%DB_USER%"=="" set DB_USER=voting_user
if "%DB_PASS%"=="" set DB_PASS=voting_user_pass

echo Checking MySQL client...

REM Try XAMPP MySQL first
if exist "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" --version >nul 2>&1
) else (
    rem ensure errorlevel is 1 when missing
    cmd /c exit 1 >nul 2>&1
)
if errorlevel 1 (
    REM If XAMPP MySQL not found, try standalone MySQL
    mysql --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: MySQL client not found.
        echo Please ensure either XAMPP or standalone MySQL is installed.
        pause
        popd >nul
        endlocal
        exit /b 1
    ) else (
        set MYSQL_CMD=mysql
        echo Using standalone MySQL client.
    )
) else (
    set MYSQL_CMD="C:\xampp\mysql\bin\mysql.exe"
    echo Using XAMPP MySQL client.
)
echo MySQL client found.
echo.

echo Checking MySQL server connection...
echo SELECT 1; | %MYSQL_CMD% --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASS% >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL server at %DB_HOST%:%DB_PORT%
    echo Please ensure MySQL server is running and credentials are correct.
    echo.
    echo You can set environment variables:
    echo   set DB_HOST=your_mysql_host
    echo   set DB_PORT=your_mysql_port
    echo   set DB_USER=your_mysql_user
    echo   set DB_PASS=your_mysql_password
    echo.
    echo Or pass them as arguments:
    echo   setup-database.bat --host your_host --user your_user --password your_pass
    pause
    popd >nul
    endlocal
    exit /b 1
)
echo MySQL server connection successful.
echo.

echo Creating database '%DB_NAME%' if it doesn't exist...
%MYSQL_CMD% --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
    echo ERROR: Failed to create database
    pause
    popd >nul
    endlocal
    exit /b 1
)
echo Database '%DB_NAME%' is ready.
echo.

if exist "database\schema.sql" (
    echo Importing database schema...
    %MYSQL_CMD% --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASS% %DB_NAME% < database\schema.sql
    if errorlevel 1 (
        echo ERROR: Failed to import database schema
        pause
        popd >nul
        endlocal
        exit /b 1
    )
    echo Database schema imported successfully.
) else (
    echo WARNING: Schema file not found: database\schema.sql
    echo Please ensure the database schema file exists.
)
echo.

echo Verifying database setup...

REM Check if tables exist
set TABLES_COUNT=0
for /f "usebackq delims=" %%i in (`%MYSQL_CMD% --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASS% --database=%DB_NAME% -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '%DB_NAME%' AND table_type = 'BASE TABLE';" 2^>nul`) do (
    set TABLES_COUNT=%%i
)

if "%TABLES_COUNT%"=="0" (
    echo ERROR: No tables found in database. Setup may have failed.
    pause
    popd >nul
    endlocal
    exit /b 1
) else (
    echo Found %TABLES_COUNT% tables in database.
)

echo.
echo Created tables:
for /f "usebackq delims=" %%i in (`%MYSQL_CMD% --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASS% --database=%DB_NAME% -N -B -e "SELECT table_name FROM information_schema.tables WHERE table_schema = '%DB_NAME%' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2^>nul`) do (
    echo   - %%i
)

echo.

REM Check if default admin user exists
set ADMIN_COUNT=0
for /f "usebackq delims=" %%i in (`%MYSQL_CMD% --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASS% --database=%DB_NAME% -N -B -e "SELECT COUNT(*) FROM users WHERE email = 'admin@votingsystem.com';" 2^>nul`) do (
    set ADMIN_COUNT=%%i
)

if "%ADMIN_COUNT%"=="1" (
    echo Default admin user created (admin@votingsystem.com)
    echo.
    echo IMPORTANT: Change the default password 'Admin123!' immediately after first login!
) else (
    echo WARNING: Default admin user not found. Please check the schema.sql file.
)

echo.
echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo -----------
echo 1. Start XAMPP Control Panel and ensure Apache + MySQL are running
echo 2. Start the Python blockchain: cd python-blockchain ^&^& python run.py
echo 3. Start the Node.js WebSocket server: cd node-ws ^&^& npm start
echo 4. Start the frontend: cd frontend ^&^& npm run dev
echo 5. Access the application at http://localhost:5173
echo.
echo Configuration used:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.
pause
popd >nul
endlocal
