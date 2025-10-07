@echo off
echo ========================================
echo DREAM TOOL Backend Startup and Test
echo ========================================

cd /d "c:\Users\Olivia\DREAM_TOOL\backend"

echo.
echo 1. Starting backend server...
echo ========================================
start "DREAM Backend" cmd /k "npm run dev"

echo.
echo 2. Waiting for backend to start...
timeout /t 10 /nobreak

echo.
echo 3. Testing backend connectivity...
curl -s http://localhost:3001/health > nul
if %errorlevel% equ 0 (
    echo ✅ Backend is running and accessible
) else (
    echo ❌ Backend not accessible yet, waiting longer...
    timeout /t 5 /nobreak
)

echo.
echo 4. Creating mock data...
echo ========================================
curl -X POST http://localhost:3001/api/mock-data/create-mock-data -H "Content-Type: application/json"

echo.
echo.
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Go to http://127.0.0.1:58360/survey-analysis
echo 2. Refresh the page (F5)
echo 3. You should now see data instead of "Failed to load"
echo.
echo Backend is running in the separate window.
echo Keep that window open to maintain the backend server.
echo.
pause
