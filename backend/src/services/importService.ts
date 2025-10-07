import { Op, Transaction } from 'sequelize';
import { Facility, Survey, RawImport } from '../models';
import { ImportJob, ImportStatus, ImportSourceType, RecordStatus, ImportProgress, ImportRecord, ImportConfig } from '../types/importJob';

// Debug logging
const debug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [ImportService] ${message}`, data || '');
};

const error = (message: string, err?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ImportService] ❌ ${message}`, err || '');
};

type ImportSource = 'kobo' | 'csv' | 'api';

interface ProcessedData {
  facilityData: {
    name: string;
    type: 'healthcare' | 'education' | 'community';
    latitude: number;
    longitude: number;
    status: 'survey' | 'design' | 'installed';
    userId?: number | null;
  };
  surveyData: Record<string, any>;
}

export class ImportService {
  /**
   * Queue a new import for processing
   */
  async queueImport(source: ImportSource, data: any, userId?: number) {
    debug(`Queueing import from source: ${source}`, { userId, dataKeys: Object.keys(data) });
    try {
      const importRecord = await RawImport.create({
        source,
        data,
        metadata: {
          receivedAt: new Date(),
          userId,
          // Add any source-specific metadata
          ...(source === 'kobo' && data._id && {
            koboFormId: data._id,
            submissionTime: data._submission_time
          })
        }
      });
      debug(`Successfully queued import with ID: ${importRecord.id}`);
      return importRecord;
    } catch (err) {
      error('Failed to queue import', err);
      throw err;
    }
  }

  /**
   * Process pending imports in batches
   */
  async processPendingImports(batchSize = 10) {
    debug(`Processing up to ${batchSize} pending imports`);
    
    const pendingImports = await RawImport.findAll({
      where: { status: 'pending' },
      limit: batchSize,
      order: [['createdAt', 'ASC']],
      lock: true,
      skipLocked: true,
    });
    
    debug(`Found ${pendingImports.length} pending imports to process`);

    const results = [];
    for (const raw of pendingImports) {
      try {
        const result = await this.processSingleImport(raw);
        results.push({ id: raw.id, status: 'success' as const, result });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ 
          id: raw.id, 
          status: 'error' as const, 
          error: errorMessage 
        });
      }
    }

    return { processed: pendingImports.length, results };
  }

  /**
   * Process a single import record
   */
  private async processSingleImport(raw: any) {
    const transaction = await RawImport.sequelize!.transaction();
    
    try {
      // Mark as processing
      await raw.update({ status: 'processing' }, { transaction });

      // Transform the raw data
      const { facilityData, surveyData } = this.transformData(raw.data, raw.source);

      // Create facility and survey in a transaction
      const facility = await Facility.create(facilityData, { transaction });
      const survey = await Survey.create({
        ...surveyData,
        facilityId: facility.id,
        createdBy: raw.metadata?.userId || null,
      }, { transaction });

      // Update raw import with results
      await raw.update({
        status: 'processed',
        metadata: {
          ...raw.metadata,
          processedAt: new Date(),
          facilityId: facility.id,
          surveyId: survey.id
        }
      }, { transaction });

      await transaction.commit();
      return { facility, survey };

    } catch (error: unknown) {
      await transaction.rollback();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? error.stack || error.message : String(error);
      
      // Update with error details
      await raw.update({
        status: 'failed',
        error: errorMessage,
        metadata: {
          ...raw.metadata,
          failedAt: new Date(),
          errorDetails
        }
      });
      
      throw error;
    }
  }

  /**
   * Transform raw data into facility and survey data
   */
  private transformData(data: any, source: ImportSource): ProcessedData {
    switch (source) {
      case 'kobo':
        return this.transformKoboData(data);
      case 'csv':
        return this.transformCsvData(data);
      case 'api':
      default:
        return this.transformGenericData(data);
    }
  }

  private transformKoboData(koboData: any): ProcessedData {
    // Extract GPS coordinates if available
    let latitude = 0;
    let longitude = 0;
    
    if (koboData.gps) {
      const [lat, lon] = koboData.gps.split(' ').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) {
        latitude = lat;
        longitude = lon;
      }
    }

    return {
      facilityData: {
        name: koboData.facility_name || 'Unnamed Facility',
        type: this.mapFacilityType(koboData.facility_type),
        latitude,
        longitude,
        status: 'survey',
        userId: koboData.userId || koboData.user_id || null
      },
      surveyData: {
        externalId: koboData._id || `kobo-${Date.now()}`,
        facilityData: koboData,
        collectionDate: koboData.start ? new Date(koboData.start) : new Date(),
        respondentId: koboData._submitted_by || null,
        status: 'completed',
        metadata: {
          source: 'kobo',
          submissionTime: koboData._submission_time,
          version: koboData._version_
        }
      }
    };
  }

  private transformCsvData(csvData: any): ProcessedData {
    // Implement CSV transformation logic
    return this.transformGenericData(csvData);
  }

  private transformGenericData(data: any): ProcessedData {
    // Default transformation for unknown formats
    return {
      facilityData: {
        name: data.name || data.facilityName || 'Unnamed Facility',
        type: this.mapFacilityType(data.type || data.facilityType),
        latitude: parseFloat(data.latitude || data.lat || '0'),
        longitude: parseFloat(data.longitude || data.lng || data.lon || '0'),
        status: 'survey',
        userId: data.userId || null
      },
      surveyData: {
        externalId: data.id || `import-${Date.now()}`,
        facilityData: data,
        collectionDate: data.date ? new Date(data.date) : new Date(),
        respondentId: data.respondentId || null,
        status: 'completed',
        metadata: {
          source: 'generic',
          importTime: new Date().toISOString()
        }
      }
    };
  }

  private mapFacilityType(inputType: string): 'healthcare' | 'education' | 'community' {
    if (!inputType) return 'healthcare';
    
    const typeMap: Record<string, 'healthcare' | 'education' | 'community'> = {
      // Kobo form values
      'health_center': 'healthcare',
      'hospital': 'healthcare',
      'school': 'education',
      'university': 'education',
      'community_center': 'community',
      
      // Common variations
      'health': 'healthcare',
      'medical': 'healthcare',
      'clinic': 'healthcare',
      'education': 'education',
      'schooling': 'education',
      'community': 'community',
      'public': 'community'
    };
    
    const normalizedType = inputType.toString().toLowerCase().trim();
    return typeMap[normalizedType] || 'healthcare';
  }

  /**
   * Get import status by ID
   */
  async getImportStatus(importId: string) {
    return RawImport.findByPk(importId);
  }

  /**
   * List imports with filtering options
   */
  async listImports({
    status,
    source,
    limit = 50,
    offset = 0
  }: {
    status?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;

    return RawImport.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Retry a failed import
   */
  async retryImport(importId: string) {
    const raw = await RawImport.findByPk(importId);
    if (!raw) {
      throw new Error('Import not found');
    }

    if (raw.status !== 'failed') {
      throw new Error('Only failed imports can be retried');
    }

    return this.processSingleImport(raw);
  }

  /**
   * Transform a RawImport instance to the ImportJob DTO structure expected by the frontend
   * @param rawImport The raw import record from the database
   * @returns An ImportJob DTO with the expected frontend structure
   */
  async toImportJob(rawImport: any): Promise<ImportJob> {
    debug(`Transforming raw import ${rawImport.id} to ImportJob structure`);
    
    // Map the raw import status to the frontend status enum
    const statusMap: Record<string, ImportStatus> = {
      'pending': ImportStatus.PENDING,
      'processing': ImportStatus.RUNNING,
      'processed': ImportStatus.COMPLETED,
      'failed': ImportStatus.FAILED
    };
    
    const status = statusMap[rawImport.status] || ImportStatus.PENDING;
    
    // Extract source information
    const source = rawImport.source as ImportSourceType;
    
    // Get config information from metadata
    const metadata = rawImport.metadata || {};
    const config: ImportConfig = {
      source,
      mappingProfile: metadata.mappingProfile,
      startDate: metadata.startDate ? new Date(metadata.startDate) : undefined,
      endDate: metadata.endDate ? new Date(metadata.endDate) : undefined,
      apiEndpoint: metadata.apiEndpoint,
      apiKey: metadata.apiKey ? '[REDACTED]' : undefined // Don't send API key to frontend
    };
    
    // Calculate progress data
    let progress: ImportProgress = {
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0
    };
    
    // Extract any recorded progress from metadata
    if (metadata.progress) {
      progress = {
        ...progress,
        ...metadata.progress
      };
    }
    
    // Get logs from metadata if available
    const logs = Array.isArray(metadata.logs) ? metadata.logs : [];
    
    // Extract failed records if available (from metadata or data)
    let records: ImportRecord[] = [];
    
    // Try to extract records from various potential sources
    if (Array.isArray(metadata.failedRecords)) {
      // Direct failed records in metadata
      records = metadata.failedRecords.map((record: any) => ({
        id: record.id || String(Math.random()).slice(2),
        facilityName: record.facilityName || 'Unknown facility',
        submissionDate: record.submissionDate || new Date(rawImport.createdAt).toISOString(),
        status: RecordStatus.FAILED,
        errors: Array.isArray(record.errors) ? record.errors : [record.message || 'Unknown error']
      }));
    } else if (rawImport.status === 'failed' && rawImport.error) {
      // Create a single failed record entry if there's a top-level error
      records = [{
        id: String(Math.random()).slice(2),
        facilityName: metadata.facilityName || 'Unknown facility',
        submissionDate: new Date(rawImport.createdAt).toISOString(),
        status: RecordStatus.FAILED,
        errors: [rawImport.error]
      }];
    }
    
    // Compile the ImportJob
    const importJob: ImportJob = {
      id: rawImport.id,
      createdAt: rawImport.createdAt.toISOString(),
      startedAt: metadata.startedAt ? new Date(metadata.startedAt).toISOString() : undefined,
      completedAt: metadata.completedAt ? new Date(metadata.completedAt).toISOString() : undefined,
      source,
      status,
      config,
      progress,
      records,
      logs,
      error: rawImport.error || undefined
    };
    
    return importJob;
  }

  /**
   * Transform multiple RawImport instances to ImportJob DTOs for listing/history
   * @param rawImports Array of raw import records
   * @param total Total count (for pagination)
   * @param page Current page number
   * @param limit Items per page
   * @returns Paginated response of ImportJob DTOs
   */
  async toImportJobsList(rawImports: any[], total: number, page: number, limit: number): Promise<{
    items: ImportJob[];
    total: number;
    page: number;
    pages: number;
  }> {
    const importJobs: ImportJob[] = [];
    
    for (const rawImport of rawImports) {
      importJobs.push(await this.toImportJob(rawImport));
    }
    
    return {
      items: importJobs,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Update progress information for an import job
   * @param importId The raw import ID
   * @param progress Progress update data
   * @param logs Optional log messages to append
   */
  async updateImportProgress(importId: string, progress: Partial<ImportProgress>, logs: string[] = []): Promise<void> {
    const raw = await RawImport.findByPk(importId);
    if (!raw) {
      throw new Error(`Import ${importId} not found`);
    }
    
    const metadata = raw.metadata || {};
    const currentProgress = metadata.progress || {
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0
    };
    
    const currentLogs = Array.isArray(metadata.logs) ? metadata.logs : [];
    
    await raw.update({
      metadata: {
        ...metadata,
        progress: { ...currentProgress, ...progress },
        logs: [...currentLogs, ...logs]
      }
    });
    
    debug(`Updated progress for import ${importId}`, progress);
  }

  /**
   * Record failed records for an import job
   * @param importId The raw import ID
   * @param failedRecords Records that failed to import
   */
  async recordFailedRecords(importId: string, failedRecords: ImportRecord[]): Promise<void> {
    const raw = await RawImport.findByPk(importId);
    if (!raw) {
      throw new Error(`Import ${importId} not found`);
    }
    
    const metadata = raw.metadata || {};
    const currentFailedRecords = Array.isArray(metadata.failedRecords) ? metadata.failedRecords : [];
    
    await raw.update({
      metadata: {
        ...metadata,
        failedRecords: [...currentFailedRecords, ...failedRecords]
      }
    });
    
    debug(`Recorded ${failedRecords.length} failed records for import ${importId}`);
  }
}
