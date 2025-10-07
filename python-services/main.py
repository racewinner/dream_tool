"""
DREAM Tool Python Microservices
FastAPI application for scientific computing and analytics
"""

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Import routers
from routers import energy, mcda, analytics
from routes import (
    data_import, survey_analysis, energy_analysis, demand_scenarios, 
    demand_data_api, equipment_planning_api, monitoring, weather_service,
    solar_analysis, chart_data, techno_economic, maintenance_analytics,
    reopt_optimization, image_api, solar_analysis_api, solar_monitoring_api,
    solar_report_api
)
from core.auth import verify_token
from core.database import engine, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DREAM Tool Python Services",
    description="Scientific computing and analytics microservices for DREAM Tool",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme
security = HTTPBearer()

# Create database tables
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    try:
        # Create database tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Initialize any required services
        logger.info("🚀 DREAM Tool Python Services started successfully")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "dream-tool-python-services",
        "version": "1.0.0"
    }

# Protected route example
@app.get("/protected")
async def protected_route(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Example of a protected route that requires authentication"""
    user = await verify_token(credentials.credentials)
    return {"message": f"Hello {user['email']}, you are authenticated!"}

# Include routers
app.include_router(
    energy.router,
    prefix="/api/python/energy",
    tags=["Energy Modeling"],
    dependencies=[Depends(verify_token)]
)

app.include_router(
    mcda.router,
    prefix="/api/python/mcda",
    tags=["MCDA Analysis"],
    dependencies=[Depends(verify_token)]
)

app.include_router(
    analytics.router,
    prefix="/api/python/analytics",
    tags=["Advanced Analytics"],
    dependencies=[Depends(verify_token)]
)

app.include_router(
    data_import.router,
    prefix="/api/python",
    tags=["Data Import & Processing"]
)

# Survey Analysis Routes (replaces TypeScript surveyAnalysisService)
app.include_router(
    survey_analysis.router,
    prefix="/api/python",
    tags=["Survey Analysis"]
)

# Energy Analysis Routes (replaces TypeScript energyModelingService)
app.include_router(
    energy_analysis.router,
    prefix="/api/python",
    tags=["Energy Analysis"]
)

# Weather Service Routes (replaces TypeScript weatherService)
app.include_router(
    weather_service.router,
    prefix="/api/python/weather",
    tags=["Weather Service"],
    dependencies=[Depends(verify_token)]
)

# Solar Analysis Routes (replaces TypeScript solarAnalysisService)
app.include_router(
    solar_analysis.router,
    prefix="/api/python/solar",
    tags=["Solar Analysis"],
    dependencies=[Depends(verify_token)]
)

# Chart Data Routes (replaces TypeScript chartDataService)
app.include_router(
    chart_data.router,
    prefix="/api/python/chart-data",
    tags=["Chart Data Service"],
    dependencies=[Depends(verify_token)]
)

# Monitoring Routes (replaces TypeScript monitoringService)
app.include_router(
    monitoring.router,
    prefix="/api/python/monitoring",
    tags=["Monitoring Service"],
    dependencies=[Depends(verify_token)]
)

# Techno-Economic Routes (replaces TypeScript techno-economic service)
app.include_router(
    techno_economic.router,
    prefix="/api/python/techno-economic",
    tags=["Techno-Economic Assessment"],
    dependencies=[Depends(verify_token)]
)

# Maintenance Analytics Routes (replaces TypeScript maintenanceAnalytics)
app.include_router(
    maintenance_analytics.router,
    prefix="/api/python/maintenance-analytics",
    tags=["Maintenance Analytics"],
    dependencies=[Depends(verify_token)]
)

# REopt Energy Optimization Routes (NREL REopt API integration)
app.include_router(
    reopt_optimization.router,
    prefix="/api/python/reopt-optimization",
    tags=["REopt Energy Optimization"],
    dependencies=[Depends(verify_token)]
)

# Demand-Driven Scenario Analysis Routes
app.include_router(
    demand_scenarios.router,
    prefix="/api/python/demand-scenarios",
    tags=["Demand Scenario Analysis"],
    dependencies=[Depends(verify_token)]
)

# Demand Data Provider API Routes (for service-to-service communication)
app.include_router(
    demand_data_api.router,
    prefix="/api/python/demand-data",
    tags=["Demand Data Provider"],
    dependencies=[Depends(verify_token)]
)

# Equipment Planning API Routes
app.include_router(
    equipment_planning_api.router,
    prefix="/api/python/equipment-planning",
    tags=["Equipment Planning"],
    dependencies=[Depends(verify_token)]
)

app.include_router(
    image_api.router,
    prefix="/api/python/images",
    tags=["Image Processing"],
    dependencies=[Depends(verify_token)]
)

# Solar PV Analysis API Routes
app.include_router(
    solar_analysis_api.router,
    prefix="/api/python/solar-analysis",
    tags=["Solar PV Analysis"],
    dependencies=[Depends(verify_token)]
)

# Solar Monitoring API Routes
app.include_router(
    solar_monitoring_api.router,
    prefix="/api/python/solar-monitoring",
    tags=["Solar Monitoring"],
    dependencies=[Depends(verify_token)]
)

# Solar Report API Routes
app.include_router(
    solar_report_api.router,
    prefix="/api/python/solar-report",
    tags=["Solar Reports"],
    dependencies=[Depends(verify_token)]
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "DREAM Tool Python Microservices",
        "version": "1.0.0",
        "services": [
            "Data Import & Processing (KoboToolbox, CSV, Excel, JSON)",
            "Survey Analysis (Statistical, ML, Geographic)",
            "Energy Analysis (Load Modeling, System Optimization)",
            "Weather Service (Multi-provider, Caching, Validation)",
            "Solar Analysis (PV Potential, System Optimization)",
            "Chart Data Service (Visualization, Data Processing)",
            "Monitoring Service (Performance, Metrics, Alerts)",
            "Techno-Economic Assessment (NPV, IRR, LCOE, Risk Analysis)",
            "Maintenance Analytics (ML Predictions, Anomaly Detection, Cost Optimization)",
            "REopt Energy Optimization (NREL API Integration, Advanced DER Optimization)",
            "Demand Scenario Analysis (8 Scenario Types, Technology/Economic Integration)",
            "Demand Data Provider (Centralized Energy Demand Data for All Services)",
            "Equipment Planning (Future Equipment Scenarios, Recommendations, Validation)",
            "Image Processing (Survey Image Storage, Processing, Retrieval)",
            "Solar PV Component Analysis (AI-powered Photo Analysis, Issue Detection, Upgrade Recommendations)",
            "Energy Modeling",
            "MCDA Analysis", 
            "Advanced Analytics"
        ],
        "replaced_typescript_services": [
            "dataImportService.ts",
            "surveyAnalysisService.ts", 
            "energyModelingService.ts",
            "weatherService.ts",
            "solarAnalysisService.ts",
            "chartDataService.ts",
            "monitoringService.ts",
            "techno-economic.ts (routes + utils)",
            "maintenanceAnalytics.ts"
        ],
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
