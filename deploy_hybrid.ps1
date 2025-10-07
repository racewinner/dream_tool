# DREAM Tool Hybrid Architecture Deployment Script
# PowerShell script for Windows deployment

Write-Host "Deploying DREAM Tool Hybrid Architecture..." -ForegroundColor Green

# Check if environment files exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

if (-not (Test-Path "python-services\.env")) {
    Write-Host "Creating python-services/.env file..." -ForegroundColor Yellow
    Copy-Item "python-services\.env.example" "python-services\.env"
}

# Create nginx cache directory
if (-not (Test-Path "nginx\cache")) {
    Write-Host "Creating nginx cache directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "nginx\cache" -Force
}

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start services
Write-Host "Building and starting services..." -ForegroundColor Green
docker-compose up --build -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "Checking service health..." -ForegroundColor Green

$services = @(
    @{Name="Nginx Gateway"; Url="http://localhost/health"},
    @{Name="TypeScript Backend"; Url="http://localhost/api/health"},
    @{Name="Python Energy Service"; Url="http://localhost/api/python/energy/health"},
    @{Name="Python MCDA Service"; Url="http://localhost/api/python/mcda/health"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "SUCCESS: $($service.Name): Healthy" -ForegroundColor Green
        } else {
            Write-Host "WARNING: $($service.Name): Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "ERROR: $($service.Name): Not responding" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost/docs" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Container Status:" -ForegroundColor Yellow
docker-compose ps
