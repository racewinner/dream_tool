# Simple PowerShell script to test the ultra-simple server
Write-Host "`n🧪 Testing ultra-simple server with direct curl commands...`n" -ForegroundColor Cyan

# Ping endpoint
Write-Host "Testing: GET /ping" -ForegroundColor Yellow
curl -s http://localhost:3001/ping

# Health endpoint
Write-Host "`n`nTesting: GET /health" -ForegroundColor Yellow
curl -s http://localhost:3001/health

Write-Host "`n`n✅ Test completed" -ForegroundColor Green
