# DREAM TOOL - COMPLETE SYSTEM ARCHITECTURE

**Generated**: 2025-10-06  
**Version**: 1.0  
**Status**: Production Ready

---

## 🏗️ SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    DREAM TOOL ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (React/TypeScript) - PORT 5173                      │
│  ├── 62 Pages                                                  │
│  ├── 70 Components                                             │
│  ├── 46 Services (NEEDS CONSOLIDATION)                         │
│  └── Authentication & RBAC System                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BACKEND (Node.js/TypeScript) - PORT 3001                     │
│  ├── Authentication & User Management                          │
│  ├── Legacy Survey Routes (BEING DEPRECATED)                   │
│  ├── Asset Management                                           │
│  └── WhatsApp Integration                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PYTHON SERVICES (FastAPI) - PORT 8000                        │
│  ├── 18 Route Modules (MAIN BUSINESS LOGIC)                   │
│  ├── 30 Service Modules (ADVANCED ANALYTICS)                  │
│  ├── ML/AI Capabilities                                        │
│  └── Data Import & Processing                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATABASE (PostgreSQL)                                         │
│  ├── Shared by Backend & Python Services                       │
│  ├── Survey Data with facilityData & rawData                   │
│  └── Complete RBAC Schema                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 FRONTEND PAGES → PYTHON SERVICES MAPPING

### **1. AUTHENTICATION PAGES**
```
📄 Pages:
├── Login.tsx
├── Register.tsx  
├── EmailVerification.tsx
├── PasswordReset.tsx
├── PasswordResetRequest.tsx
├── TwoFactorSetup.tsx
└── TwoFactorDisable.tsx

🔗 Backend Routes (Node.js):
├── POST /api/auth/login
├── POST /api/auth/register
├── POST /api/auth/verify-email
├── POST /api/auth/reset-password
├── POST /api/auth/request-reset
├── POST /api/auth/setup-2fa
└── POST /api/auth/disable-2fa

⚠️  Note: Authentication remains on Node.js backend
```

### **2. DASHBOARD PAGES**
```
📄 Pages:
├── MainDashboard.tsx
├── Dashboard.tsx
├── EnergyDashboard.tsx
└── PortfolioDashboard.tsx

🐍 Python Services:
├── /api/python/analytics/dashboard-metrics
├── /api/python/energy-analysis/facility-overview
├── /api/python/monitoring/system-health
├── /api/python/chart-data/dashboard-charts
└── /api/python/demand-data/get-demand-data
```

### **3. SURVEY & DATA MANAGEMENT**
```
📄 Pages:
├── data/DetailView.tsx ⭐ CRITICAL PAGE
├── data/EnhancedSurveyAnalysisDashboard.tsx
├── SurveyAnalysisDashboard.tsx
├── SurveyAnalysisDashboardSimple.tsx
├── SurveyDashboard.tsx
├── SurveyImport.tsx
└── SurveyManagement.tsx

🐍 Python Services:
├── /api/python/data/surveys ⭐ MAIN SURVEY LIST
├── /api/python/data/surveys/{survey_id} ⭐ SURVEY DETAIL
├── /api/python/survey-analysis/analyze-survey/{survey_id}
├── /api/python/survey-analysis/analyze-batch
├── /api/python/survey-analysis/facility-distribution
├── /api/python/survey-analysis/repeat-groups
├── /api/python/import/kobo-survey
├── /api/python/import/batch-surveys
└── /api/python/import/file-upload

📊 Components:
├── SurveyCompletenessChart
├── SurveyDetailDialog
├── SurveyDataTable
└── SurveyAnalyticsCards
```

### **4. ENERGY ANALYSIS & DESIGN**
```
📄 Pages:
├── design/DesignLanding.tsx
├── design/EquipmentSelection.tsx
├── design/ParametersPage.tsx
├── design/ScenarioComparison.tsx
└── TechnoEconomic.tsx

🐍 Python Services:
├── /api/python/energy-analysis/load-profile
├── /api/python/energy-analysis/demand-analysis
├── /api/python/energy-analysis/survey-scenario
├── /api/python/techno-economic/analysis/{facility_id}
├── /api/python/techno-economic/parameters
├── /api/python/demand-scenarios/generate-scenarios
├── /api/python/demand-scenarios/scenario-comparison
└── /api/python/equipment-planning/recommendations

📊 Components:
├── LoadProfileChart
├── EnergyScenarioComparison
├── EquipmentBreakdownTable
├── TechnoEconomicResults
└── SystemSizingCalculator
```

### **5. SOLAR PV ANALYSIS**
```
📄 Pages:
├── pv-sites/PVSitesLanding.tsx
└── WeatherAnalysis.tsx

🐍 Python Services:
├── /api/python/solar-analysis/site-assessment
├── /api/python/solar-analysis/irradiance-analysis
├── /api/python/solar-monitoring/performance-data
├── /api/python/solar-monitoring/system-health
├── /api/python/solar-report/generate-report
├── /api/python/weather/forecast
├── /api/python/weather/historical-data
└── /api/python/reopt-optimization/optimize

📊 Components:
├── SolarIrradianceChart
├── PVPerformanceMetrics
├── WeatherDataVisualization
└── SolarSystemRecommendations
```

### **6. MAINTENANCE & MONITORING**
```
📄 Pages:
├── maintenance/MaintenanceLanding.tsx
├── maintenance/MaintenanceAnalyticsDashboard.tsx
├── maintenance/WhatsAppBotPage.tsx
├── MaintenanceDashboardPage.tsx
└── AssetManagement.tsx

🐍 Python Services:
├── /api/python/maintenance-analytics/predictive-analysis
├── /api/python/maintenance-analytics/cost-optimization
├── /api/python/maintenance-analytics/performance-trends
├── /api/python/monitoring/system-status
├── /api/python/monitoring/alert-management
└── /api/python/images/process-maintenance-photos

🔗 Backend Routes (WhatsApp):
├── /api/whatsapp/send-message
├── /api/whatsapp/webhook
└── /api/whatsapp/analytics

📊 Components:
├── MaintenanceScheduleCalendar
├── PredictiveAnalyticsChart
├── AssetHealthIndicators
└── WhatsAppChatInterface
```

### **7. MCDA & DECISION ANALYSIS**
```
📄 Pages:
└── mcda/MCDAPage.tsx

🔗 Backend Routes (Node.js):
├── /api/sites/mcda/facilities
├── /api/sites/mcda/criteria
├── /api/sites/mcda/analyze
└── /api/sites/mcda/comparison-pairs

🐍 Supporting Data:
├── /api/python/demand-data/mcda-data
└── /api/python/analytics/facility-metrics

📊 Components:
├── SiteSelectionTable
├── CriteriaSelectionForm
├── PairwiseComparisonMatrix
├── MCDAResultsDisplay
└── WeightInputForm
```

### **8. MANAGEMENT & SETTINGS**
```
📄 Pages:
├── management/ManagementLanding.tsx
├── management/tabs/UsersTab.tsx
├── management/tabs/SystemTab.tsx
├── management/tabs/LogsTab.tsx
└── settings/SettingsPage.tsx

🔗 Backend Routes (Node.js):
├── /api/management/users
├── /api/management/system-info
├── /api/management/logs
├── /api/settings/user-preferences
└── /api/settings/system-config

🐍 Supporting Services:
├── /api/python/stats/database-health
└── /api/python/stats/import-statistics

📊 Components:
├── UserManagementTable
├── SystemHealthMetrics
├── LogViewer
└── SettingsForm
```

---

## 🔧 FRONTEND SERVICES CONSOLIDATION PLAN

### **CURRENT SERVICES (46 FILES - NEEDS CLEANUP)**
```
❌ DUPLICATES TO REMOVE:
├── surveyService.ts (18KB - OLD)
├── advancedSurveyService.ts (10KB - OLD)  
├── surveyAnalyticsService.ts (4KB - OLD)
└── Multiple Python service duplicates

✅ KEEP & UPDATE:
├── surveyDataService.ts → Point to Python services
├── authService.ts → Keep for Node.js auth
├── Python service clients (consolidated)
└── Utility services
```

### **RECOMMENDED SERVICE ARCHITECTURE**
```
📁 services/
├── 🔐 auth/
│   ├── authService.ts (Node.js backend)
│   └── userService.ts (Node.js backend)
├── 🐍 python/
│   ├── surveyDataService.ts → /api/python/data/
│   ├── energyAnalysisService.ts → /api/python/energy-analysis/
│   ├── solarAnalysisService.ts → /api/python/solar-analysis/
│   ├── maintenanceService.ts → /api/python/maintenance-analytics/
│   ├── demandScenariosService.ts → /api/python/demand-scenarios/
│   └── chartDataService.ts → /api/python/chart-data/
├── 🔧 legacy/
│   ├── mcdaService.ts (Node.js backend)
│   └── whatsappService.ts (Node.js backend)
└── 🛠️ utils/
    ├── apiClient.ts
    ├── cacheService.ts
    └── errorHandler.ts
```

---

## 🐍 PYTHON SERVICES DETAILED MAPPING

### **DATA MANAGEMENT ROUTES**
```
📁 routes/enhanced_data_routes.py
├── GET /api/python/data/surveys
├── GET /api/python/data/surveys/{survey_id} ⭐ CRITICAL
├── GET /api/python/data/facilities
└── GET /api/python/stats/import-statistics

🎯 Used By:
├── DetailView.tsx (MAIN USER)
├── SurveyAnalysisDashboard.tsx
└── SurveyManagement.tsx
```

### **SURVEY ANALYSIS ROUTES**
```
📁 routes/survey_analysis.py
├── POST /api/python/survey-analysis/analyze-survey/{survey_id}
├── POST /api/python/survey-analysis/analyze-batch
├── GET /api/python/survey-analysis/facility-distribution
├── GET /api/python/survey-analysis/repeat-groups
└── GET /api/python/survey-analysis/data-quality-metrics

🎯 Used By:
├── EnhancedSurveyAnalysisDashboard.tsx
├── SurveyAnalyticsDashboard.tsx
└── Dashboard components
```

### **ENERGY ANALYSIS ROUTES**
```
📁 routes/energy_analysis.py
├── POST /api/python/energy-analysis/load-profile
├── POST /api/python/energy-analysis/demand-analysis
├── POST /api/python/energy-analysis/survey-scenario
├── GET /api/python/energy-analysis/equipment-database
└── GET /api/python/energy-analysis/benchmarks/{facility_type}

🎯 Used By:
├── DesignLanding.tsx
├── EquipmentSelection.tsx
├── EnergyDashboard.tsx
└── ScenarioComparison.tsx
```

### **DEMAND SCENARIOS ROUTES**
```
📁 routes/demand_scenarios.py
├── POST /api/python/demand-scenarios/generate-scenarios
├── POST /api/python/demand-scenarios/scenario-comparison
├── GET /api/python/demand-scenarios/facility-scenarios/{facility_id}
└── POST /api/python/demand-scenarios/batch-analysis

🎯 Used By:
├── ScenarioComparison.tsx
├── DesignLanding.tsx
└── Energy analysis components
```

### **SOLAR ANALYSIS ROUTES**
```
📁 routes/solar_analysis_api.py
├── POST /api/python/solar-analysis/site-assessment
├── POST /api/python/solar-analysis/irradiance-analysis
├── POST /api/python/solar-analysis/system-sizing
└── GET /api/python/solar-analysis/solar-resource/{location}

🎯 Used By:
├── PVSitesLanding.tsx
├── SolarSystemComponents
└── WeatherAnalysis.tsx
```

### **MAINTENANCE ANALYTICS ROUTES**
```
📁 routes/maintenance_analytics.py
├── POST /api/python/maintenance-analytics/predictive-analysis
├── POST /api/python/maintenance-analytics/cost-optimization
├── GET /api/python/maintenance-analytics/performance-trends
└── POST /api/python/maintenance-analytics/schedule-optimization

🎯 Used By:
├── MaintenanceLanding.tsx
├── MaintenanceAnalyticsDashboard.tsx
└── AssetManagement.tsx
```

### **CHART DATA ROUTES**
```
📁 routes/chart_data.py
├── GET /api/python/chart-data/dashboard-charts
├── GET /api/python/chart-data/energy-consumption/{facility_id}
├── GET /api/python/chart-data/solar-performance/{system_id}
└── GET /api/python/chart-data/maintenance-trends

🎯 Used By:
├── All dashboard pages
├── Chart components
└── Analytics visualizations
```

---

## 🔄 CRITICAL MIGRATION TASKS

### **IMMEDIATE PRIORITIES**

1. **Fix DetailView.tsx** ⭐ CRITICAL
   ```typescript
   // CURRENT (BROKEN):
   const SURVEYS_API_URL = `${API_BASE_URL}/surveys`; // PORT 3001
   
   // SHOULD BE:
   const SURVEYS_API_URL = `${PYTHON_API_URL}/api/python/data/surveys`; // PORT 8000
   ```

2. **Update surveyDataService.ts**
   ```typescript
   // Update all endpoints to Python services
   getSurveys() → /api/python/data/surveys
   getSurveyDetail(id) → /api/python/data/surveys/{id}
   ```

3. **Register Enhanced Data Routes**
   ```python
   # python-services/main.py
   app.include_router(
       enhanced_data_routes.router,
       prefix="/api/python",
       tags=["Enhanced Data Management"],
       dependencies=[Depends(verify_token)]
   )
   ```

### **SERVICE CONSOLIDATION**

1. **Remove Duplicate Services**
   - Delete `surveyService.ts` (18KB)
   - Delete `advancedSurveyService.ts` (10KB)
   - Delete `surveyAnalyticsService.ts` (4KB)

2. **Update Import Statements**
   ```typescript
   // Replace all instances:
   import { SurveyService } from '../services/surveyService';
   // With:
   import { SurveyDataService } from '../services/surveyDataService';
   ```

3. **Standardize Python Service Calls**
   ```typescript
   // All Python services should use:
   const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
   ```

---

## 📊 COMPONENT ARCHITECTURE

### **SHARED COMPONENTS**
```
📁 components/
├── 📊 charts/
│   ├── SurveyCompletenessChart.tsx
│   ├── EnergyConsumptionChart.tsx
│   ├── SolarPerformanceChart.tsx
│   └── MaintenanceTrendsChart.tsx
├── 📋 forms/
│   ├── SurveyImportForm.tsx
│   ├── EquipmentSelectionForm.tsx
│   └── ParametersConfigForm.tsx
├── 📱 dialogs/
│   ├── SurveyDetailDialog.tsx
│   ├── EquipmentDetailDialog.tsx
│   └── AnalysisResultsDialog.tsx
└── 🔧 common/
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── DataTable.tsx
```

### **PAGE-SPECIFIC COMPONENTS**
```
📁 pages/
├── data/
│   └── components/
│       ├── SurveyList.tsx
│       ├── SurveyFilters.tsx
│       └── SurveyMetrics.tsx
├── design/
│   └── components/
│       ├── LoadProfileGenerator.tsx
│       ├── SystemSizer.tsx
│       └── CostAnalyzer.tsx
└── maintenance/
    └── components/
        ├── MaintenanceScheduler.tsx
        ├── AssetTracker.tsx
        └── PredictiveAnalytics.tsx
```

---

## 🔐 AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND                                                       │
│  ├── AuthContext (React Context)                               │
│  ├── ProtectedRoute Component                                  │
│  ├── Login/Register Pages                                      │
│  └── JWT Token Management                                      │
│                                                                 │
│  NODE.JS BACKEND (PORT 3001)                                  │
│  ├── /api/auth/* routes                                        │
│  ├── JWT Token Generation                                      │
│  ├── Password Hashing (bcrypt)                                │
│  └── User Management                                           │
│                                                                 │
│  PYTHON SERVICES (PORT 8000)                                  │
│  ├── JWT Token Verification                                    │
│  ├── Protected Route Middleware                                │
│  └── User Context in Requests                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 PERFORMANCE OPTIMIZATION

### **CACHING STRATEGY**
```
🔄 Frontend Caching:
├── React Query for API calls
├── localStorage for user preferences
└── sessionStorage for temporary data

🔄 Backend Caching:
├── Redis for session data
├── In-memory caching for frequent queries
└── Database query optimization

🔄 Python Services Caching:
├── 5-minute cache for demand scenarios
├── Daily cache for weather data
└── Persistent cache for equipment database
```

### **API OPTIMIZATION**
```
⚡ Request Optimization:
├── Batch API calls where possible
├── Pagination for large datasets
├── Compression for large responses
└── CDN for static assets

⚡ Response Optimization:
├── Only return required fields
├── Use appropriate HTTP status codes
├── Implement proper error handling
└── Add request/response logging
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
🐳 Docker Containers:
├── frontend (React/Vite) - PORT 5173
├── backend (Node.js/Express) - PORT 3001
├── python-services (FastAPI) - PORT 8000
├── postgres (Database) - PORT 5432
├── redis (Cache) - PORT 6379
└── nginx (Reverse Proxy) - PORT 80/443

🌐 Production URLs:
├── Frontend: https://dreamtool.example.com
├── Backend API: https://api.dreamtool.example.com
├── Python API: https://python-api.dreamtool.example.com
└── Database: Internal network only
```

---

## 📋 TESTING STRATEGY

### **FRONTEND TESTING**
```
🧪 Unit Tests:
├── Component testing with React Testing Library
├── Service testing with Jest
├── Utility function testing
└── Hook testing

🧪 Integration Tests:
├── API integration tests
├── Authentication flow tests
├── Page navigation tests
└── Form submission tests

🧪 E2E Tests:
├── Critical user journeys
├── Survey import workflow
├── Energy analysis workflow
└── RBAC functionality
```

### **BACKEND TESTING**
```
🧪 API Tests:
├── Route testing with supertest
├── Authentication middleware tests
├── Database integration tests
└── Error handling tests

🧪 Python Service Tests:
├── FastAPI route testing
├── Service layer testing
├── Data transformation tests
└── ML model testing
```

---

## 📝 DEVELOPMENT GUIDELINES

### **CODE ORGANIZATION**
```
📁 Frontend Structure:
├── src/
│   ├── components/ (Reusable UI components)
│   ├── pages/ (Route components)
│   ├── services/ (API clients)
│   ├── hooks/ (Custom React hooks)
│   ├── contexts/ (React contexts)
│   ├── types/ (TypeScript interfaces)
│   └── utils/ (Helper functions)

📁 Python Services Structure:
├── routes/ (FastAPI route definitions)
├── services/ (Business logic)
├── models/ (Database models)
├── core/ (Authentication, database)
└── utils/ (Helper functions)
```

### **NAMING CONVENTIONS**
```
📝 Files:
├── Components: PascalCase (SurveyDetailView.tsx)
├── Services: camelCase (surveyDataService.ts)
├── Routes: snake_case (survey_analysis.py)
└── Models: PascalCase (Survey.py)

📝 API Endpoints:
├── REST: /api/python/resource/action
├── Parameters: snake_case
└── Response: camelCase (frontend) / snake_case (Python)
```

---

## 🔍 MONITORING & LOGGING

### **APPLICATION MONITORING**
```
📊 Metrics:
├── API response times
├── Error rates by endpoint
├── User session analytics
└── Database query performance

📊 Logging:
├── Structured logging (JSON format)
├── Request/response logging
├── Error tracking with stack traces
└── User action logging
```

### **HEALTH CHECKS**
```
🏥 Health Endpoints:
├── /health (Frontend)
├── /api/health (Backend)
├── /health (Python Services)
└── Database connectivity checks
```

---

## 📞 SUPPORT & MAINTENANCE

### **TROUBLESHOOTING GUIDE**
```
🔧 Common Issues:
├── Authentication failures → Check JWT tokens
├── API timeouts → Check service health
├── Data not loading → Check Python service routes
└── Import failures → Check KoboToolbox connection

🔧 Debug Tools:
├── Browser DevTools Network tab
├── Docker container logs
├── Database query logs
└── Python service debug endpoints
```

### **MAINTENANCE TASKS**
```
🔄 Regular Tasks:
├── Database backup and cleanup
├── Log rotation and archival
├── Security updates
├── Performance monitoring
└── User feedback collection
```

---

**END OF DOCUMENT**

*This architecture document should be updated as the system evolves. Last updated: 2025-10-06*
