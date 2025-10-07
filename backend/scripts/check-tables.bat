@echo off
setlocal enabledelayedexpansion

:: Database connection settings
set DB_USER=postgres
set DB_PASSWORD=password123
set DB_NAME=dream_tool
set DB_HOST=localhost
set DB_PORT=5432

echo Checking database tables...

:: Check if psql is available
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: psql command not found. Please ensure PostgreSQL is installed and in your PATH.
    exit /b 1
)

:: Set PGPASSWORD environment variable for psql
set PGPASSWORD=%DB_PASSWORD%

echo.
echo Listing all tables in the database:
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

echo.
echo Checking if raw_imports table exists:
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'raw_imports') AS table_exists;"

echo.
echo If raw_imports exists, showing its structure:
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'raw_imports' ORDER BY ordinal_position;"

:: Clear the password from environment
set PGPASSWORD=

echo.
echo Script completed.
pause
