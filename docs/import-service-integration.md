# Import Service Integration Documentation

## Overview

This document describes the data transformation layer between the backend and frontend for handling import jobs in the DREAM TOOL application. The transformation ensures that the frontend receives a consistent data structure that matches its expectations, regardless of changes to the underlying backend implementation.

## Architecture

```
Backend                            │ Frontend
───────────────────────────────────┼───────────────────────────────
RawImport (Database Model)         │ ImportJob (Frontend Model)
↓                                  │ ↑
ImportService.toImportJob()        │ │
↓                                  │ ↑
API Response (ImportJob DTO)       →→→ importService.ts
```

## Type Definitions

### Backend Types

- Located in `backend/src/types/importJob.ts`
- Defines the data transfer object (DTO) structure for API responses
- Mirrors the frontend's expected structure

### Frontend Types

- Located in `frontend/src/types/importJob.ts`
- Used by all frontend components that display import information
- Defines enums for statuses and structured interfaces for data

## Transformation Logic

The backend `ImportService` includes methods to transform database models into frontend-friendly DTOs:

### 1. `toImportJob(rawImport: RawImport): ImportJob`

Transforms a single RawImport database model into an ImportJob object with:
- Structured progress information
- Processed record details with status
- Formatted timestamps
- Error information (if applicable)

### 2. `toImportJobsList(rawImports: RawImport[], count: number, page: number, limit: number): PaginatedImportJobsResponse`

Creates a paginated response containing:
- An array of transformed ImportJob objects
- Pagination metadata (total count, current page, total pages)

## API Response Format

All import-related API endpoints return responses in this format:

```json
{
  "success": true,
  "data": {
    // ImportJob or PaginatedImportJobsResponse data
  },
  "meta": {
    // Optional metadata
  }
}
```

## Integration Points

1. **Backend Controller**: `importController.ts`
   - `getImportStatus()`: Returns a single ImportJob
   - `listImports()`: Returns a PaginatedImportJobsResponse

2. **Frontend Service**: `importService.ts` 
   - Calls the API endpoints
   - Works with the returned ImportJob objects directly

3. **Frontend Components**: 
   - `ImportProgress.tsx`: Displays real-time import progress
   - Other components that consume ImportJob data

## Maintaining Compatibility

When making changes to import-related features:

1. Start by updating the type definitions in both backend and frontend
2. Ensure the backend transformation logic produces the expected structure
3. Update frontend components to handle any new fields or behavior

## Testing

To verify the integration is working correctly:

1. Start the backend server
2. Initiate an import in the frontend
3. Monitor the import progress display
4. Check browser console for any type errors or unexpected behavior
