# DREAM TOOL Import System Documentation

## Architecture Overview

The import system consists of:

1. **Backend Models**: Raw database models like `RawImport` that store the actual import data
2. **Backend Services**: Import processing logic including transformation from raw data to frontend DTOs
3. **Frontend Services**: API clients that fetch and display import data
4. **Shared Types**: Common type definitions used in both frontend and backend

## Transformation Flow

### 1. RawImport → ImportJob Transformation

```
RawImport (DB Model) → ImportService.toImportJob() → ImportJob (DTO) → Frontend
```

The `ImportService.toImportJob()` method handles:
- Status mapping from database enum to frontend enum
- Progress calculation from metadata
- Record and error extraction
- Configuration mapping
- Timestamp normalization

### 2. Import Process Flow

```
Frontend request → Backend controller → ImportService.queueImport() → RawImport (status: pending)
                                      → Background process → ImportService.processPendingImports()
                                                           → RawImport (status: processing)
                                                           → RawImport (status: processed/failed)
                                                           → Frontend polls status → ImportJob
```

## Type Definitions

The core types shared between frontend and backend:

- `ImportStatus`: Enum of job statuses (pending, running, completed, failed, etc.)
- `ImportSourceType`: Enum of data sources (kobo, csv, api, manual)
- `RecordStatus`: Enum for individual record status (success, failed, skipped, pending)
- `ImportProgress`: Interface for job progress tracking
- `ImportRecord`: Interface for individual imported records
- `ImportConfig`: Interface for import configuration
- `ImportJob`: Interface for the complete import job

## Implementation Notes

### Backend

1. `RawImport` model stores:
   - Raw data in JSONB fields
   - Status as enum string
   - Metadata with additional context like progress, logs, etc.

2. `ImportService` provides:
   - Data transformation methods (`toImportJob`, `toImportJobsList`)
   - Import processing logic
   - Status management
   - Error handling

### Frontend

The frontend service makes API calls to:
- `/api/import/kobo/surveys` - Start KoboToolbox import with date range
- `/api/import/kobo/surveys/recent` - Start KoboToolbox import with recent data
- `/api/import/status/:id` - Get import job status
- `/api/import/history` - Get import job history

## Integration Points

### Endpoint Mapping

| Frontend Action | Backend Endpoint | Controller Method |
|----------------|-----------------|------------------|
| startImport    | POST /api/import/kobo/surveys | importController.importFromKobo |
| getImportStatus | GET /api/import/status/:id | importController.getImportStatus |
| getImportHistory | GET /api/import/history | importController.listImports |
| rerunImport | POST /api/import/:id/retry | importController.retryImport |

## Improvement Opportunities

1. **Frontend Transformation**: 
   - The frontend should consume the backend's transformed ImportJob directly instead of reconstructing it
   - Update the KoboToolbox import logic to use the backend's response format

2. **Automated Type Generation**:
   - Consider using a script to generate frontend types from backend models
   - Keep backend as the single source of truth for all shared types

3. **Error Handling**:
   - Implement consistent error format across all endpoints
   - Add detailed error logging for failed imports
