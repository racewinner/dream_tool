# DREAM TOOL Backend Startup and Mock Data Creation Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DREAM TOOL Backend Startup and Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Change to backend directory
Set-Location "c:\Users\Olivia\DREAM_TOOL\backend"

Write-Host "`n1. Starting backend server..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Start backend in a new window
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\Olivia\DREAM_TOOL\backend'; npm run dev" -PassThru

Write-Host "✅ Backend process started (PID: $($backendProcess.Id))" -ForegroundColor Green

Write-Host "`n2. Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n3. Testing backend connectivity..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$maxRetries = 10
$retryCount = 0
$backendReady = $false

while ($retryCount -lt $maxRetries -and -not $backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is running and accessible!" -ForegroundColor Green
            $backendReady = $true
        }
    }
    catch {
        $retryCount++
        Write-Host "⏳ Attempt $retryCount/$maxRetries - Backend not ready yet, waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start properly. Check the backend window for errors." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n4. Creating mock data..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

try {
    $mockDataResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/mock-data/create-mock-data" -Method POST -ContentType "application/json" -Body "{}"
    
    if ($mockDataResponse.success) {
        Write-Host "✅ Mock data created successfully!" -ForegroundColor Green
        Write-Host "   📊 Created: $($mockDataResponse.data.surveys) surveys, $($mockDataResponse.data.facilities) facilities" -ForegroundColor Green
    } else {
        Write-Host "❌ Mock data creation failed: $($mockDataResponse.message)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error creating mock data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Verifying data creation..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

try {
    $countResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/mock-data/data-count" -Method GET
    
    if ($countResponse.success) {
        Write-Host "✅ Data verification successful!" -ForegroundColor Green
        Write-Host "   📊 Total data: $($countResponse.data.surveys) surveys, $($countResponse.data.facilities) facilities" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error verifying data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "1. Go to http://127.0.0.1:58360/survey-analysis" -ForegroundColor White
Write-Host "2. Refresh the page (F5)" -ForegroundColor White
Write-Host "3. You should now see data instead of 'Failed to load'" -ForegroundColor White
Write-Host "`nBackend is running in the separate window." -ForegroundColor Yellow
Write-Host "Keep that window open to maintain the backend server." -ForegroundColor Yellow

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
