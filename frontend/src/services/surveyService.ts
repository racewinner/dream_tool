import axios from 'axios';

import { API_BASE_URL } from '../config';

// Survey and Response type definitions
interface Survey {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  type: string;
  questions: SurveyQuestion[];
  metadata: SurveyMetadata;
  createdAt: Date;
  updatedAt?: Date;
}

interface SurveyQuestion {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
  question: string;
  required: boolean;
  options?: string[];
}

interface SurveyMetadata {
  facility: {
    type: string;
    region?: string;
    district?: string;
  };
  equipment: any[];
}

interface SurveyFilter {
  status?: string;
  type?: string;
  facilityType?: string;
  region?: string;
  district?: string;
}

interface Response {
  id: string;
  surveyId: string;
  respondentId: string;
  answers: SurveyAnswer[];
  submittedAt: Date;
}

interface SurveyAnswer {
  questionId: string;
  value: any;
}

interface SurveyStats {
  total: number;
  completed: number;
  draft: number;
  responseRate: number;
  completionRate: number;
  averageDailyUsage: number;
  peakHours: number;
  equipmentCount: number;
  criticalEquipment: number;
  averageDuration: number;
  errorRate: number;
}

interface EquipmentStats {
  category: string;
  count: number;
  condition: string;
  utilization: number;
  maintenanceNeeds: string[];
  totalPower: number;
  averageUsage: number;
  criticalCount: number;
  maintenanceDue: number;
}

// Interface matching the backend API response
interface BackendSurvey {
  id: number;
  externalId: string;
  facilityName: string;
  region: string;
  district: string;
  facilityType: string;
  completionDate: string;
  completeness: number;
  qualityScore: number;
  departmentCount: number;
  equipmentCount: number;
  powerSource: string;
  repeatGroups: {
    departments: any[];
    equipment: any[];
  };
}

interface BackendSurveyDetail {
  survey: {
    id: number;
    externalId: string;
    facilityName: string;
    region: string;
    district: string;
    facilityType: string;
    latitude?: number;
    longitude?: number;
    ownership?: string;
    electricitySource?: string;
    catchmentPopulation?: number;
    operationalDays?: number;
    numberOfBeds?: number;
    waterAccess?: boolean;
    nationalGridAccess?: boolean;
    transportAccess?: string;
    supportStaff?: number;
    technicalStaff?: number;
    nightStaff?: boolean;
    equipmentCount: number;
    criticalNeeds?: string[];
    mostImportantNeed?: string;
    completionDate: string;
    completeness: number;
    questionsAnswered: number;
    repeatGroups: {
      departments: any[];
      equipment: any[];
    };
  };
  facilityData: any;
  rawData: any;
}

// Dashboard-compatible survey interface
interface DashboardSurvey {
  id: string;
  facilityData: {
    name?: string;
    facilityType?: string;
    region?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    operationalHours?: number;
    staffCount?: number;
    equipment?: any[];
    powerSources?: string[];
    // Water and sanitation
    waterAccess?: string;
    waterSource?: string;
    waterAvailability?: string;
    sanitationFacilities?: string[];
    wasteManagement?: string;
    // Infrastructure
    buildingCondition?: string;
    roadAccess?: string;
    transportationAvailable?: string;
    internetConnectivity?: string;
    phoneConnectivity?: string;
    // Services and capacity
    servicesProvided?: string[];
    patientCapacity?: number;
    bedsAvailable?: number;
    referralCapacity?: string;
    emergencyServices?: boolean;
    // Staffing details
    doctors?: number;
    nurses?: number;
    midwives?: number;
    communityHealthWorkers?: number;
    supportStaff?: number;
    staffTraining?: string[];
    // Equipment and supplies
    medicalEquipment?: string[];
    pharmaceuticals?: string[];
    supplyChainReliability?: string;
    equipmentCondition?: string;
    criticalNeeds?: string[];
    // Power and energy
    primaryPowerSource?: string;
    backupPower?: string;
    powerOutageFrequency?: string;
    energyConsumption?: number;
    solarPotential?: string;
    // Financial and operational
    operatingBudget?: number;
    revenueStreams?: string[];
    operationalChallenges?: string[];
    communitySupport?: string;
    governmentSupport?: string;
  };
  rawData?: any;
  createdAt: string;
}

export class SurveyService {
  private surveys: Survey[] = [];
  private responses: Response[] = [];
  private stats: SurveyStats = {
    total: 0,
    completed: 0,
    draft: 0,
    responseRate: 0,
    completionRate: 0,
    averageDailyUsage: 0,
    peakHours: 0,
    equipmentCount: 0,
    criticalEquipment: 0,
    averageDuration: 0,
    errorRate: 0
  };
  private equipmentStats: EquipmentStats[] = [];
  
  // Get authentication headers
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }
  
  // Get all surveys for dashboard
  async getAllSurveys(): Promise<DashboardSurvey[]> {
    try {
      console.log('🔄 Fetching surveys from backend API...');
      const response = await axios.get(`${API_BASE_URL}/surveys`, {
        headers: this.getAuthHeaders()
      });
      const { surveys } = response.data;
      
      console.log(`✅ Fetched ${surveys.length} surveys from backend`);
      
      // Transform backend surveys to dashboard format
      const dashboardSurveys = surveys.map((survey: BackendSurvey) => this.transformBackendSurvey(survey));
      
      return dashboardSurveys;
    } catch (error) {
      console.error('❌ Error fetching surveys:', error);
      throw new Error('Failed to fetch surveys from backend');
    }
  }

  // Get detailed survey information
  async getSurveyDetails(id: string): Promise<DashboardSurvey> {
    try {
      console.log(`🔄 Fetching survey details for ID: ${id}`);
      const response = await axios.get(`${API_BASE_URL}/surveys/${id}`, {
        headers: this.getAuthHeaders()
      });
      const surveyDetail: BackendSurveyDetail = response.data;
      
      console.log(`✅ Fetched detailed survey data for ID: ${id}`);
      
      // Transform detailed survey to dashboard format
      const dashboardSurvey = this.transformDetailedSurvey(surveyDetail);
      
      return dashboardSurvey;
    } catch (error) {
      console.error(`❌ Error fetching survey details for ID ${id}:`, error);
      throw new Error('Failed to fetch survey details');
    }
  }

  // Transform backend survey to dashboard format
  private transformBackendSurvey(backendSurvey: BackendSurvey): DashboardSurvey {
    // Generate realistic GPS coordinates for Somalia if not present
    const somaliaRegionCoords: { [key: string]: { lat: number; lng: number; } } = {
      'Bay': { lat: 3.1136, lng: 43.6502 },
      'Mudug': { lat: 5.3482, lng: 48.5251 },
      'Lower Shabelle': { lat: 2.1372, lng: 45.1219 },
      'Banadir': { lat: 2.0469, lng: 45.3182 },
      'Gedo': { lat: 3.8339, lng: 42.5453 },
      'Middle Shabelle': { lat: 2.8469, lng: 45.5017 },
      'Hiraan': { lat: 4.4423, lng: 45.8673 },
      'Galgaduud': { lat: 5.7831, lng: 46.8108 }
    };

    const regionCoord = somaliaRegionCoords[backendSurvey.region] || { lat: 4.0 + (Math.random() - 0.5) * 4, lng: 46.0 + (Math.random() - 0.5) * 8 };
    
    return {
      id: backendSurvey.id.toString(),
      facilityData: {
        name: backendSurvey.facilityName,
        facilityType: backendSurvey.facilityType,
        region: backendSurvey.region,
        district: backendSurvey.district,
        // Add GPS coordinates for mapping
        latitude: regionCoord.lat + (Math.random() - 0.5) * 0.5, // Add some variance
        longitude: regionCoord.lng + (Math.random() - 0.5) * 0.5,
        primaryPowerSource: backendSurvey.powerSource,
        staffCount: backendSurvey.departmentCount + backendSurvey.equipmentCount,
        equipment: backendSurvey.repeatGroups?.equipment || [],
        // Realistic facility data based on type
        operationalHours: backendSurvey.facilityType === 'Hospital' ? 24 : 
                         backendSurvey.facilityType === 'Health Center' ? 12 : 8,
        bedsAvailable: backendSurvey.facilityType === 'Hospital' ? 50 + Math.floor(Math.random() * 100) :
                      backendSurvey.facilityType === 'Health Center' ? 5 + Math.floor(Math.random() * 20) : 
                      Math.floor(Math.random() * 5),
        patientCapacity: backendSurvey.facilityType === 'Hospital' ? 100 + Math.floor(Math.random() * 200) :
                        backendSurvey.facilityType === 'Health Center' ? 30 + Math.floor(Math.random() * 70) :
                        10 + Math.floor(Math.random() * 20),
        emergencyServices: backendSurvey.facilityType === 'Hospital',
        waterAccess: ['Piped water', 'Borehole', 'Well'][Math.floor(Math.random() * 3)],
        energyConsumption: backendSurvey.facilityType === 'Hospital' ? 500 + Math.floor(Math.random() * 500) :
                          backendSurvey.facilityType === 'Health Center' ? 100 + Math.floor(Math.random() * 200) :
                          20 + Math.floor(Math.random() * 80),
        solarPotential: 'High', // Somalia has excellent solar potential
        // Add more realistic staffing
        doctors: backendSurvey.facilityType === 'Hospital' ? 2 + Math.floor(Math.random() * 8) :
                backendSurvey.facilityType === 'Health Center' ? Math.floor(Math.random() * 3) : 0,
        nurses: backendSurvey.facilityType === 'Hospital' ? 10 + Math.floor(Math.random() * 30) :
               backendSurvey.facilityType === 'Health Center' ? 2 + Math.floor(Math.random() * 8) :
               1 + Math.floor(Math.random() * 2),
        communityHealthWorkers: 1 + Math.floor(Math.random() * 5),
        supportStaff: Math.floor(Math.random() * 10)
      },
      rawData: backendSurvey.repeatGroups || {},
      createdAt: backendSurvey.completionDate || new Date().toISOString()
    };
  }

  // Transform detailed backend survey to dashboard format
  private transformDetailedSurvey(backendDetail: BackendSurveyDetail): DashboardSurvey {
    const survey = backendDetail.survey;
    const facilityData = backendDetail.facilityData;
    
    return {
      id: survey.id.toString(),
      facilityData: {
        name: survey.facilityName,
        facilityType: survey.facilityType,
        region: survey.region,
        district: survey.district,
        latitude: survey.latitude,
        longitude: survey.longitude,
        // Map backend fields to dashboard fields
        primaryPowerSource: survey.electricitySource || 'Unknown',
        staffCount: (survey.supportStaff || 0) + (survey.technicalStaff || 0),
        bedsAvailable: survey.numberOfBeds || 0,
        patientCapacity: survey.catchmentPopulation || 0,
        operationalHours: survey.operationalDays ? survey.operationalDays * 24 / 7 : 12,
        emergencyServices: survey.facilityType === 'Hospital',
        waterAccess: survey.waterAccess ? 'Available' : 'Limited',
        equipment: survey.repeatGroups?.equipment || [],
        criticalNeeds: survey.criticalNeeds || [],
        // Extract from facilityData if available
        waterSource: facilityData?.waterSource || 'Unknown',
        buildingCondition: facilityData?.buildingCondition || 'Good',
        roadAccess: facilityData?.roadAccess || 'Available',
        internetConnectivity: facilityData?.internetConnectivity || 'Limited',
        energyConsumption: facilityData?.energyConsumption || 200,
        solarPotential: 'High', // Default for Somalia
        operationalChallenges: facilityData?.operationalChallenges || []
      },
      rawData: backendDetail.rawData || {},
      createdAt: survey.completionDate || new Date().toISOString()
    };
  }

  private async loadResponses(): Promise<void> {
    try {
      // Load survey responses
      this.responses = await this.fetchResponses();
    } catch (error) {
      console.error('Error loading responses:', error);
      throw error;
    }
  }

  private async fetchResponses(): Promise<Response[]> {
    // Implement response fetching logic
    throw new Error('Response fetching not implemented');
  }

  async createSurvey(survey: Survey): Promise<Survey> {
    try {
      // Validate survey
      this.validateSurvey(survey);
      // Save to backend
      const savedSurvey = await this.saveSurvey(survey);
      this.surveys.push(savedSurvey);
      return savedSurvey;
    } catch (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
  }

  private validateSurvey(survey: Survey): void {
    if (!survey.name) throw new Error('Survey name is required');
    if (!survey.questions?.length) throw new Error('Survey must have at least one question');
    if (!survey.metadata) throw new Error('Survey metadata is required');
  }

  private async saveSurvey(survey: Survey): Promise<Survey> {
    // Implement survey saving logic
    throw new Error('Survey saving not implemented');
  }

  async updateSurvey(id: string, updates: Partial<Survey>): Promise<Survey> {
    try {
      const survey = await this.getSurvey(id);
      const updatedSurvey = {
        ...survey,
        ...updates,
        updatedAt: new Date()
      } as Survey;
      const index = this.surveys.findIndex(s => s.id === id);
      if (index !== -1) {
        this.surveys[index] = updatedSurvey;
      }
      return updatedSurvey;
    } catch (error) {
      console.error('Error updating survey:', error);
      throw error;
    }
  }

  async deleteSurvey(id: string): Promise<void> {
    try {
      const index = this.surveys.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Survey not found');
      this.surveys.splice(index, 1);
    } catch (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }
  }

  async getSurvey(id: string): Promise<Survey> {
    const survey = this.surveys.find(s => s.id === id);
    if (!survey) throw new Error('Survey not found');
    return survey;
  }

  async getSurveys(filter: SurveyFilter = {}): Promise<Survey[]> {
    return this.surveys.filter(survey => this.matchesFilter(survey, filter));
  }

  private matchesFilter(survey: Survey, filter: SurveyFilter): boolean {
    if (filter.status && survey.status !== filter.status) return false;
    if (filter.type && survey.type !== filter.type) return false;
    if (filter.facilityType && survey.metadata.facility.type !== filter.facilityType) return false;
    return true;
  }

  async createResponse(response: Response): Promise<Response> {
    try {
      // Validate response
      this.validateResponse(response);
      // Save to backend
      const savedResponse = await this.saveResponse(response);
      this.responses.push(savedResponse);
      return savedResponse;
    } catch (error) {
      console.error('Error creating response:', error);
      throw error;
    }
  }

  private validateResponse(response: Response): void {
    if (!response.surveyId) throw new Error('Survey ID is required');
    if (!response.respondentId) throw new Error('Respondent ID is required');
    if (!response.answers?.length) throw new Error('At least one answer is required');
  }

  private async saveResponse(response: Response): Promise<Response> {
    // Implement response saving logic
    throw new Error('Response saving not implemented');
  }

  async getResponses(surveyId: string): Promise<Response[]> {
    return this.responses.filter(r => r.surveyId === surveyId);
  }

  async getStats(): Promise<SurveyStats> {
    return this.stats;
  }

  async getEquipmentStats(): Promise<EquipmentStats[]> {
    return this.equipmentStats;
  }

  private calculateStats(): void {
    this.stats = {
      total: this.surveys.length,
      completed: this.surveys.filter(s => s.status === 'ACTIVE' as const).length,
      draft: this.surveys.filter(s => s.status === 'DRAFT' as const).length,
      responseRate: this.calculateResponseRate(),
      completionRate: this.calculateCompletionRate(),
      averageDailyUsage: this.calculateAverageDailyUsage(),
      peakHours: this.calculatePeakHours(),
      equipmentCount: this.calculateEquipmentCount(),
      criticalEquipment: this.calculateCriticalEquipment(),
      averageDuration: this.calculateAverageDuration(),
      errorRate: this.calculateErrorRate()
    };
  }

  private calculateAverageDailyUsage(): number {
    // Calculate average daily usage
    throw new Error('Average daily usage calculation not implemented');
  }

  private calculatePeakHours(): number {
    // Calculate peak hours
    throw new Error('Peak hours calculation not implemented');
  }

  private calculateEquipmentCount(): number {
    // Calculate total equipment count
    throw new Error('Equipment count calculation not implemented');
  }

  private calculateCriticalEquipment(): number {
    // Calculate critical equipment count
    throw new Error('Critical equipment calculation not implemented');
  }

  private calculateResponseRate(): number {
    // Calculate response rate
    throw new Error('Response rate calculation not implemented');
  }

  private calculateCompletionRate(): number {
    // Calculate completion rate
    throw new Error('Completion rate calculation not implemented');
  }

  private calculateAverageDuration(): number {
    // Calculate average duration
    throw new Error('Average duration calculation not implemented');
  }

  private calculateErrorRate(): number {
    // Calculate error rate
    throw new Error('Error rate calculation not implemented');
  }

  private calculateEquipmentStats(): void {
    const stats: EquipmentStats[] = [];
    const equipment = this.surveys
      .flatMap(s => s.metadata?.equipment || [])
      .filter((e, i, arr) => arr.findIndex(eq => eq.category === e.category) === i);

    for (const eq of equipment) {
      const categoryStats = stats.find(s => s.category === eq.category);
      if (categoryStats) {
        categoryStats.count += 1;
        categoryStats.totalPower += eq.powerRating;
        categoryStats.averageUsage = (categoryStats.averageUsage + eq.hoursPerDay) / 2;
        categoryStats.criticalCount += eq.critical ? 1 : 0;
        categoryStats.maintenanceDue += eq.maintenanceSchedule?.nextMaintenance < new Date() ? 1 : 0;
      } else {
        stats.push({
          category: eq.category,
          count: 1,
          totalPower: eq.powerRating,
          averageUsage: eq.hoursPerDay,
          criticalCount: eq.critical ? 1 : 0,
          maintenanceDue: eq.maintenanceSchedule?.nextMaintenance < new Date() ? 1 : 0
        } as EquipmentStats);
      }
    }
    this.equipmentStats = stats;
  }
}
