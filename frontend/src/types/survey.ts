// Enums for survey types and statuses
export enum SurveyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED'
}

export enum SurveyType {
  FACILITY = 'FACILITY',
  EQUIPMENT = 'EQUIPMENT',
  INFRASTRUCTURE = 'INFRASTRUCTURE'
}

export interface Survey {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  type: 'FACILITY' | 'EQUIPMENT' | 'INFRASTRUCTURE';
  questions: Question[];
  responses: Response[];
  metadata: SurveyMetadata;
}

export interface Question {
  id: string;
  text: string;
  type: 'TEXT' | 'NUMBER' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'RADIO' | 'DATE' | 'TIME';
  required: boolean;
  options?: string[];
  validation?: QuestionValidation;
  order: number;
  section: string;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean;
}

export interface Response {
  id: string;
  surveyId: string;
  respondentId: string;
  answers: Answer[];
  submittedAt: Date;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'INVALID';
  metadata: ResponseMetadata;
}

export interface Answer {
  questionId: string;
  value: any;
  files?: File[];
  notes?: string;
}

export interface File {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface SurveyMetadata {
  facility: {
    name: string;
    type: string;
    location: {
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    contact: {
      name: string;
      email: string;
      phone: string;
    };
  };
  equipment: Equipment[];
  infrastructure: {
    waterAccess: boolean;
    nationalGrid: boolean;
    digitalConnectivity: string;
    powerSupply: {
      type: string;
      capacity: number;
      reliability: number;
    };
  };
}

export interface ResponseMetadata {
  duration: number;
  device: {
    type: string;
    os: string;
    browser: string;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  network: {
    type: string;
    speed: number;
  };
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  category: string;
  powerRating: number;
  quantity: number;
  hoursPerDay: number;
  hoursPerNight: number;
  timeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  weeklyUsage: number;
  critical: boolean;
  maintenanceSchedule: {
    frequency: string;
    lastMaintenance: Date;
    nextMaintenance: Date;
  };
}

export interface SurveyStats {
  total: number;
  completed: number;
  draft: number;
  averageDailyUsage: number;
  peakHours: number;
  equipmentCount: number;
  criticalEquipment: number;
  responseRate: number;
  completionRate: number;
  averageDuration: number;
  errorRate: number;
}

export interface EquipmentStats {
  category: string;
  count: number;
  totalPower: number;
  averageUsage: number;
  criticalCount: number;
  maintenanceDue: number;
}

export interface SurveyFilter {
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  type?: 'FACILITY' | 'EQUIPMENT' | 'INFRASTRUCTURE';
  dateRange?: {
    start: Date;
    end: Date;
  };
  facilityType?: string;
  equipmentCategory?: string;
  responseStatus?: 'IN_PROGRESS' | 'COMPLETED' | 'INVALID';
}
