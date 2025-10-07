# Simple PowerShell script to test endpoints with curl
Write-Host "`n🧪 Testing backend endpoints with simple curl commands...`n" -ForegroundColor Cyan

# Health endpoint
Write-Host "Testing: GET /health" -ForegroundColor Yellow
curl -s http://localhost:3001/health

# Import health endpoint
Write-Host "`n`nTesting: GET /api/import/health" -ForegroundColor Yellow
curl -s http://localhost:3001/api/import/health

# Import status endpoint
Write-Host "`n`nTesting: GET /api/import/status" -ForegroundColor Yellow
curl -s http://localhost:3001/api/import/status

# KoboToolbox recent import endpoint
Write-Host "`n`nTesting: POST /api/import/kobo/surveys/recent" -ForegroundColor Yellow
curl -s -X POST http://localhost:3001/api/import/kobo/surveys/recent -H "Content-Type: application/json" -d "{}"

Write-Host "`n`n✅ Test completed" -ForegroundColor Green
