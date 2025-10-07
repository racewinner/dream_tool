/**
 * Python Data Service Integration
 * Advanced data import, cleaning, and validation using Python services
 */

// Python API Configuration
const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const PYTHON_API_URL = `${PYTHON_API_BASE_URL}/api/python`;

// Enhanced interfaces for Python data services
export interface DataImportResult {
  success: boolean;
  source: string;
  records_processed: number;
  records_imported: number;
  records_failed: number;
  processing_time_seconds: number;
  validation_results: ValidationResult[];
  data_quality_score: number;
  completeness_score: number;
  recommendations: string[];
  summary: string;
}

export interface ValidationResult {
  field: string;
  issue_type: string;
  severity: 'error' | 'warning' | 'info';
  count: number;
  message: string;
  affected_records?: number[];
  suggested_fix?: string;
}

export interface ValidationReport {
  overall_status: 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED';
  total_issues: number;
  errors: number;
  warnings: number;
  info: number;
  issues_by_field: { [field: string]: ValidationResult[] };
  critical_issues: ValidationResult[];
  recommendations: string[];
  summary: string;
}

export interface SurveyAnalysisResult {
  survey_count: number;
  completeness_score: number;
  data_quality_score: number;
  facility_distribution: { [type: string]: number };
  date_distribution: { [date: string]: number };
  missing_fields: string[];
  summary: string;
  recommendations: string[];
  statistical_insights: {
    correlations?: {
      strong_correlations: Array<{
        field1: string;
        field2: string;
        correlation: number;
      }>;
      correlation_matrix: { [field: string]: { [field: string]: number } };
    };
    distributions?: { [field: string]: {
      is_normal: boolean;
      normality_p_value: number;
      skewness: number;
      kurtosis: number;
      distribution_type: string;
    }};
  };
  data_patterns: {
    facility_patterns?: any;
    geographic_patterns?: any;
    equipment_patterns?: any;
    operational_patterns?: any;
  };
  facility_clusters?: {
    num_clusters: number;
    features_used: string[];
    cluster_summary: { [cluster: string]: { [field: string]: number } };
    cluster_sizes: { [cluster: string]: number };
  };
  geographic_analysis?: {
    total_facilities_with_coords: number;
    geographic_center: { latitude: number; longitude: number };
    spread_statistics: {
      mean_distance_from_center: number;
      max_distance_from_center: number;
      std_distance: number;
    };
  };
  temporal_analysis?: {
    date_range: {
      start_date: string;
      end_date: string;
      total_days: number;
    };
    survey_frequency: {
      total_survey_days: number;
      avg_surveys_per_day: number;
      max_surveys_single_day: number;
      busiest_survey_date: string;
    };
  };
}

export interface CleaningResult {
  success: boolean;
  original_record_count: number;
  cleaned_record_count: number;
  records_removed: number;
  cleaning_efficiency: number;
  cleaned_data: any[];
}

export interface SupportedFormat {
  description: string;
  mime_types: string[];
  max_size_mb: number;
  features: string[];
}

export interface SupportedFormats {
  json: SupportedFormat;
  csv: SupportedFormat;
  excel: SupportedFormat;
}

class PythonDataService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Import survey data from JSON format
   */
  async importJsonData(
    data: any[] | any,
    options: {
      source?: string;
      validate?: boolean;
      clean?: boolean;
    } = {}
  ): Promise<DataImportResult> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/import-json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data,
        source: options.source || 'frontend_json',
        validate: options.validate !== false,
        clean: options.clean !== false
      })
    });

    const result = await this.handleResponse<{ success: boolean; data: DataImportResult }>(response);
    return result.data;
  }

  /**
   * Import survey data from CSV file
   */
  async importCsvFile(
    file: File,
    options: {
      source?: string;
      validate?: boolean;
      clean?: boolean;
    } = {}
  ): Promise<DataImportResult> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('source', options.source || 'frontend_csv');
    formData.append('validate', String(options.validate !== false));
    formData.append('clean', String(options.clean !== false));

    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/import-csv`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    const result = await this.handleResponse<{ success: boolean; data: DataImportResult }>(response);
    return result.data;
  }

  /**
   * Import survey data from Excel file
   */
  async importExcelFile(
    file: File,
    options: {
      sheetName?: string;
      source?: string;
      validate?: boolean;
      clean?: boolean;
    } = {}
  ): Promise<DataImportResult> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    formData.append('file', file);
    if (options.sheetName) {
      formData.append('sheet_name', options.sheetName);
    }
    formData.append('source', options.source || 'frontend_excel');
    formData.append('validate', String(options.validate !== false));
    formData.append('clean', String(options.clean !== false));

    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/import-excel`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    const result = await this.handleResponse<{ success: boolean; data: DataImportResult }>(response);
    return result.data;
  }

  /**
   * Validate survey data without importing
   */
  async validateData(data: any[] | any): Promise<{
    validation_report: ValidationReport;
    validation_details: ValidationResult[];
  }> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/validate-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data })
    });

    const result = await this.handleResponse<{
      success: boolean;
      validation_report: ValidationReport;
      validation_details: ValidationResult[];
    }>(response);
    
    return {
      validation_report: result.validation_report,
      validation_details: result.validation_details
    };
  }

  /**
   * Analyze survey data without importing
   */
  async analyzeData(data: any[] | any): Promise<SurveyAnalysisResult> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/analyze-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data })
    });

    const result = await this.handleResponse<{ success: boolean; analysis: SurveyAnalysisResult }>(response);
    return result.analysis;
  }

  /**
   * Clean survey data without importing
   */
  async cleanData(data: any[] | any): Promise<CleaningResult> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/clean-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data })
    });

    return this.handleResponse<CleaningResult>(response);
  }

  /**
   * Get supported data import formats
   */
  async getSupportedFormats(): Promise<{
    supported_formats: SupportedFormats;
    required_fields: string[];
    optional_fields: string[];
    equipment_fields: string[];
  }> {
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/supported-formats`);
    return this.handleResponse(response);
  }

  /**
   * Get data quality metrics
   */
  async getDataQualityMetrics(): Promise<{
    total_records: number;
    average_quality_score: number;
    records_with_coordinates: number;
    complete_records_percentage: number;
    last_import_date: string | null;
  }> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/data-quality-metrics`, {
      headers
    });

    const result = await this.handleResponse<{ success: boolean; metrics: any }>(response);
    return result.metrics;
  }

  /**
   * Test KoboToolbox connection
   */
  async testKoboConnection(config: { 
    baseUrl: string; 
    apiToken: string; 
  }): Promise<{
    success: boolean;
    message: string;
    forms?: Array<{
      uid: string;
      name: string;
      asset_type: string;
      date_created: string;
      date_modified: string;
      deployment__submission_count: number;
    }>;
  }> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/kobo/connection-test`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config)
    });

    return this.handleResponse(response);
  }

  /**
   * Import data from KoboToolbox by date range
   */
  async importFromKoboByDateRange(params: {
    formId: string;
    startDate: string;
    endDate: string;
    baseUrl?: string;
    apiToken?: string;
  }): Promise<DataImportResult> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/kobo/import-by-date-range`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    const result = await this.handleResponse<{ success: boolean; data: DataImportResult }>(response);
    return result.data;
  }

  /**
   * Import data from KoboToolbox by survey ID
   */
  async importFromKoboById(params: {
    formId: string;
    surveyId: string;
    baseUrl?: string;
    apiToken?: string;
  }): Promise<DataImportResult> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/data-import/kobo/import-by-id`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    const result = await this.handleResponse<{ success: boolean; data: DataImportResult }>(response);
    return result.data;
  }

  /**
   * Utility method to convert TypeScript survey data to Python format
   */
  convertToUniversalFormat(surveyData: any): any {
    // Convert TypeScript survey format to a universal format that Python can process
    if (Array.isArray(surveyData)) {
      return surveyData.map(item => this.convertSingleRecord(item));
    } else {
      return this.convertSingleRecord(surveyData);
    }
  }

  private convertSingleRecord(record: any): any {
    // Handle nested facility data structure
    if (record.facilityData) {
      return {
        facility_name: record.facilityData.name,
        facility_type: record.facilityData.facilityType,
        latitude: record.facilityData.latitude,
        longitude: record.facilityData.longitude,
        operational_hours: record.facilityData.operationalHours,
        staff_count: record.facilityData.staffCount,
        population_served: record.facilityData.populationServed,
        electricity_source: record.facilityData.electricitySource,
        monthly_electricity_cost: record.facilityData.monthlyElectricityCost,
        survey_date: record.surveyDate || record.createdAt,
        // Convert equipment data
        ...this.convertEquipmentData(record.facilityData.equipment || [])
      };
    }

    // Handle flat structure
    return {
      facility_name: record.facility_name || record.name,
      facility_type: record.facility_type || record.facilityType,
      latitude: record.latitude,
      longitude: record.longitude,
      operational_hours: record.operational_hours || record.operationalHours,
      staff_count: record.staff_count || record.staffCount,
      population_served: record.population_served || record.populationServed,
      electricity_source: record.electricity_source || record.electricitySource,
      monthly_electricity_cost: record.monthly_electricity_cost || record.monthlyElectricityCost,
      survey_date: record.survey_date || record.surveyDate || record.createdAt,
      ...record
    };
  }

  private convertEquipmentData(equipment: any[]): any {
    const equipmentData: any = {};
    
    equipment.forEach((item, index) => {
      const prefix = `equipment_${index}`;
      equipmentData[`${prefix}_name`] = item.name || item.type;
      equipmentData[`${prefix}_power`] = item.powerRating || item.power_rating;
      equipmentData[`${prefix}_hours`] = item.hoursPerDay || item.hours_per_day;
      equipmentData[`${prefix}_quantity`] = item.quantity;
      equipmentData[`${prefix}_condition`] = item.condition;
    });

    return equipmentData;
  }

  /**
   * Batch processing for large datasets
   */
  async processBatchData(
    data: any[],
    batchSize: number = 100,
    operation: 'import' | 'validate' | 'analyze' | 'clean' = 'import'
  ): Promise<any[]> {
    const results = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        let batchResult;
        switch (operation) {
          case 'import':
            batchResult = await this.importJsonData(batch, { source: `batch_${i / batchSize + 1}` });
            break;
          case 'validate':
            batchResult = await this.validateData(batch);
            break;
          case 'analyze':
            batchResult = await this.analyzeData(batch);
            break;
          case 'clean':
            batchResult = await this.cleanData(batch);
            break;
        }
        
        results.push({
          batch_index: i / batchSize,
          batch_size: batch.length,
          result: batchResult
        });
        
      } catch (error) {
        results.push({
          batch_index: i / batchSize,
          batch_size: batch.length,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const pythonDataService = new PythonDataService();
export default pythonDataService;
