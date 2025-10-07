# Solar PV Component Analysis System

## Overview

The Solar PV Component Analysis System is an AI-powered solution that automatically processes photos of solar PV components (panels, batteries, inverters, and MPPT controllers) to determine system capacity, detect issues, and generate upgrade recommendations. This system leverages computer vision and machine learning to provide valuable insights for solar system assessment and maintenance.

## Architecture

The system follows the hybrid architecture pattern established in the DREAM Tool, with Python services handling the AI and computational aspects while integrating with the existing TypeScript/React frontend.

### Components

1. **Database Models** (`python-services/models/solar_analysis_models.py`)
   - SQLAlchemy models for storing solar PV photo analysis data
   - Models for assessments, components, capacity analysis, issues, and recommendations

2. **AI Vision Service** (`python-services/services/solar_vision_service.py`)
   - AI-powered component detection and analysis
   - Integration with OpenAI Vision API
   - System capacity calculation and issue detection

3. **Photo Service** (`python-services/services/solar_photo_service.py`)
   - Download and storage of component photos
   - Image optimization and processing
   - Annotation of photos with detected components

4. **API Routes** (`python-services/routes/solar_analysis_api.py`)
   - RESTful endpoints for assessment creation, photo upload, and analysis
   - KoboToolbox webhook integration
   - Background task processing

5. **Frontend Client** (`frontend/src/services/solarAnalysisService.ts`)
   - TypeScript client for interacting with the Python API
   - Type definitions for solar system components and analysis results

## Key Features

### 1. Component Detection and Analysis

The system can detect and analyze four types of solar PV components:

- **Solar Panels**
  - Panel count detection
  - Condition assessment
  - Mounting type identification
  - Issue detection (dirt, damage, shading)

- **Batteries**
  - Battery count detection
  - Wiring configuration identification
  - Condition assessment
  - Issue detection (corrosion, swelling, leakage)

- **Inverters**
  - Installation quality assessment
  - Ventilation adequacy check
  - Issue detection (wiring, overheating)

- **MPPT Controllers**
  - Installation quality assessment
  - Issue detection (display errors, connections)

### 2. System Capacity Analysis

The system calculates key system capacity metrics:

- Solar capacity (kW)
- Battery capacity (kWh)
- Inverter capacity (kW)
- MPPT capacity (kW)
- Estimated backup hours
- System balance status

### 3. Issue Detection

The system identifies various issues with solar PV components:

- Dirt and dust accumulation
- Physical damage or cracks
- Discoloration
- Shading from trees or buildings
- Misalignment or poor mounting
- Battery terminal corrosion
- Battery swelling or leakage
- Poor ventilation
- Loose connections
- Overheating signs

### 4. Upgrade Recommendations

Based on the analysis, the system generates upgrade recommendations:

- Capacity expansion recommendations
- Replacement recommendations
- Maintenance recommendations
- Installation improvement recommendations

Each recommendation includes:
- Priority level
- Cost estimation
- Annual savings estimation
- Payback period calculation
- ROI calculation
- Implementation notes

### 5. KoboToolbox Integration

The system integrates with KoboToolbox for automated processing of survey photos:

- Webhook endpoint for receiving survey submissions
- Automatic extraction of component photos
- Background processing of photos
- Linking analysis results to facility data

## API Endpoints

### Assessment Management

- `POST /api/python/solar-analysis/assessments` - Create a new assessment
- `GET /api/python/solar-analysis/assessments/{assessment_id}` - Get assessment details
- `GET /api/python/solar-analysis/assessments` - List assessments

### Photo Upload and Analysis

- `POST /api/python/solar-analysis/assessments/{assessment_id}/upload` - Upload a component photo
- `POST /api/python/solar-analysis/assessments/{assessment_id}/analyze` - Start assessment analysis

### KoboToolbox Integration

- `POST /api/python/solar-analysis/webhooks/kobo` - KoboToolbox webhook endpoint

## Data Flow

1. **Photo Submission**
   - Photos are submitted via KoboToolbox survey or manual upload
   - System creates an assessment record and stores photos

2. **AI Analysis**
   - Vision service analyzes photos to detect components and issues
   - System calculates capacity metrics and system balance

3. **Issue Detection**
   - System identifies issues based on component analysis
   - Issues are categorized by severity and component type

4. **Recommendation Generation**
   - System generates upgrade recommendations based on issues and capacity analysis
   - Recommendations include cost and ROI calculations

5. **Results Storage**
   - Analysis results are stored in the database for retrieval
   - Annotated photos are generated and stored

## Integration with Existing Systems

The Solar PV Component Analysis System integrates with several existing DREAM Tool systems:

1. **Image Processing System**
   - Uses the same storage and optimization patterns
   - Extends the image handling capabilities to solar components

2. **Facility Management**
   - Links assessments to facilities for comprehensive facility management
   - Provides solar system information for facility dashboards

3. **Techno-Economic Assessment**
   - Provides system capacity information for techno-economic models
   - Complements the existing PV system design workflow

4. **MCDA Analysis**
   - Provides solar system data as criteria for MCDA
   - Enhances site selection with solar system assessment data

## Technical Implementation

### AI Vision Integration

The system uses OpenAI's Vision API to analyze solar component photos:

```python
async def analyze_solar_panels(self, image_url: str) -> Dict[str, Any]:
    """Analyze solar panels in an image"""
    prompt = """Analyze this solar panel installation photo and provide:
    
    1. Count the total number of solar panels visible
    2. Assess the condition of the panels
    3. Identify mounting type
    4. Detect any visible issues
    ...
    """
    
    return await self._analyze_image(image_url, prompt)
```

### System Capacity Calculation

The system calculates system capacity based on component analysis:

```python
def _calculate_system_capacity(self, results: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate system capacity from component analysis results"""
    capacity = {}
    
    # Calculate solar capacity
    solar_panels = results.get("solar_panels", {})
    panel_count = solar_panels.get("panel_count", 0)
    panel_watts = solar_panels.get("estimated_panel_watts")
    
    if panel_count and panel_watts:
        capacity["solar_capacity_kw"] = (panel_count * panel_watts) / 1000
        capacity["panel_count"] = panel_count
        capacity["individual_panel_watts"] = panel_watts
    
    # Calculate battery capacity
    # ...
    
    return capacity
```

### Frontend Integration

The frontend client provides a TypeScript interface for interacting with the Python API:

```typescript
/**
 * Get assessment details
 */
async getAssessment(assessmentId: string): Promise<SolarSystemAssessment> {
  const response = await fetch(`${PYTHON_API_URL}/assessments/${assessmentId}`, {
    headers: {
      ...getAuthHeader()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get assessment');
  }

  return response.json();
}
```

## Benefits

1. **Automated Analysis**: Reduces manual inspection time and human error
2. **Standardized Assessment**: Consistent evaluation of solar PV components
3. **Early Issue Detection**: Identifies problems before they cause system failure
4. **Cost-Effective Upgrades**: Prioritized recommendations based on ROI
5. **Data-Driven Decisions**: Objective analysis for maintenance and upgrade planning
6. **Integration with Existing Systems**: Enhances the overall DREAM Tool ecosystem

## Future Enhancements

1. **Enhanced AI Models**: Train specialized models for specific component types
2. **Temporal Analysis**: Track system degradation over time
3. **Performance Correlation**: Correlate visual issues with performance data
4. **Mobile App Integration**: Field assessment tool with offline capabilities
5. **Predictive Maintenance**: Predict failures before they occur

## Conclusion

The Solar PV Component Analysis System provides a powerful tool for assessing and maintaining solar PV systems. By leveraging AI and computer vision, it automates the analysis of solar components, detects issues, and generates actionable recommendations. This system enhances the DREAM Tool's capabilities for solar system design and management, providing valuable insights for decision-making.
