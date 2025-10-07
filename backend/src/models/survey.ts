import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';

// Enums for fixed value sets
export enum ElectricitySource {
  SOLAR = 'solar',
  DIESEL_GENERATOR = 'diesel generator',
  NATIONAL_GRID = 'national grid',
  MINI_GRID = 'mini grid',
  HYBRID = 'hybrid',
  NONE = 'none',
  OTHER = 'other'
}

export enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

export enum TransportAccess {
  PAVED_ROAD = 'paved_road',
  UNPAVED_ROAD = 'unpaved_road',
  SEASONAL_ACCESS = 'seasonal_access',
  DIFFICULT_ACCESS = 'difficult_access'
}

// Interface for equipment data
export interface Equipment {
  name: string;
  powerRating: number;
  quantity: number;
  hoursPerDay: number;
  hoursPerNight: number;
  timeOfDay: TimeOfDay;
  weeklyUsage: number;
}

// Interface for building information
export interface BuildingInfo {
  total: number;
  departmentsWithWiring: number;
  rooms: number;
  roomsWithConnection: number;
}

// Interface for infrastructure data
export interface Infrastructure {
  waterAccess: boolean;
  nationalGrid: boolean;
  transportationAccess: TransportAccess | null;
  communication: string | null;
  digitalConnectivity: string | null;
}

// Interface for operational hours
export interface OperationalHours {
  day: number;
  night: number;
}

// Main facility data interface
export interface FacilityData {
  // === BASIC FACILITY INFORMATION ===
  name?: string;
  region?: string;
  district?: string;
  facilityType?: string;
  
  // === GPS/GEOLOCATION INFORMATION ===
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  
  // Productive use sectors and activities
  productiveSectors: string[];
  subsectorActivities: string[];
  
  // Facility information
  ownership: string | null;
  catchmentPopulation: number | null;
  coreServices: string[];
  
  // Electricity information
  electricitySource: ElectricitySource | null;
  electricityReliability: string | null;
  electricityAvailability: string | null;
  operationalDays: number | null;
  operationalHours: OperationalHours;
  criticalNeeds: string[];
  
  // Staff information
  supportStaff: number | null;
  technicalStaff: number | null;
  nightStaff: boolean;
  
  // Building and infrastructure
  buildings: BuildingInfo;
  equipment: Equipment[];
  infrastructure: Infrastructure;
  
  // Additional facility details
  secondaryElectricitySource: string | null;
  monthlyDieselCost: number | null;
  monthlyFuelConsumption: number | null;
  annualMaintenanceCost: number | null;
  electricityMaintenanceProvider: string | null;
  hasFacilityPhone: boolean;
  numberOfWaterPumps: number | null;
  waterPumpPowerSource: string | null;
  waterTreatmentMethod: string | null;
  inpatientOutpatient: string | null;
  numberOfBeds: number | null;
  mostImportantNeed: string | null;
  averageMonthlyPatients: number | null;
  numberOfBuildings: number | null;
  numberOfStaffQuarters: number | null;
  staffQuartersPowered: boolean;
  departmentsNeedingSockets: string[];
  futureEquipmentNeeds: string[];
}

export interface SurveyAttributes {
  id: number;
  externalId: string;
  facilityId: number;
  facilityData: FacilityData;
  rawData?: any; // Store original KoboToolbox survey responses for question/answer display
  collectionDate: Date;
  respondentId: string;
  createdAt: Date;
  updatedAt: Date;
}

type SurveyCreationAttributes = Optional<SurveyAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface SurveyInstance extends Model<SurveyAttributes, SurveyCreationAttributes>, SurveyAttributes {}

// Define the static methods for Survey model
type SurveyModelStatic = ModelStatic<SurveyInstance> & {
  associate: (models: any) => void;
  findByExternalId: (externalId: string) => Promise<SurveyInstance | null>;
  findByFacility: (facilityId: number) => Promise<SurveyInstance[]>;
  findLatestForFacility: (facilityId: number) => Promise<SurveyInstance | null>;
};

// Helper function to safely parse array strings
const getArray = (value: string | undefined, separator = ';'): string[] => 
  (value || '').split(separator).map(s => s.trim()).filter(Boolean);

// Map source strings to standardized values
const mapSource = (value: string | undefined): ElectricitySource | null => {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('solar')) return ElectricitySource.SOLAR;
  if (lowerValue.includes('generator')) return ElectricitySource.DIESEL_GENERATOR;
  if (lowerValue.includes('grid')) return ElectricitySource.NATIONAL_GRID;
  return ElectricitySource.OTHER;
};

/**
 * Maps raw survey data to structured FacilityData
 * @deprecated Use dataCollectionProvider.transformSurveyData instead which provides complete field mapping
 * and proper enum typing. This function is kept only for backward compatibility with tests.
 */
export const mapSurveyRowToFacilityData = (row: Record<string, any>): FacilityData => ({
  productiveSectors: ['health facility'],
  subsectorActivities: row['Type of health facility'] ? [row['Type of health facility']] : [],
  ownership: row['Ownership'] || null,
  catchmentPopulation: Number(row['Population served']) || null,
  coreServices: getArray(row['Q14. The selected source of electricity powers the following;']),
  electricitySource: mapSource(row['Q12. What is the main source of electricity for the clinic?']),
  electricityReliability: row['Q15. Is the electricity available at the facility reliable ?'] || null,
  electricityAvailability: row['Q13. Electricity available at the facility for how long on average?'] || null,
  operationalDays: Number(row['Number of operational days']) || null,
  operationalHours: {
    day: Number(row['Average operational hours during day']) || 0,
    night: Number(row['Average operational hours during night']) || 0,
  },
  criticalNeeds: getArray(row['Q46. What do you think is the facility\'s most important need in terms of providing better health services?']),
  supportStaff: Number(row['Number of support staff']) || null,
  technicalStaff: Number(row['Number of technical staff']) || null,
  nightStaff: row['Night staff present']?.toLowerCase() === 'yes',
  buildings: {
    total: Number(row['Q51. How many separate buildings does the facility have?']) || 0,
    departmentsWithWiring: Number(row['Q54. How many departments have electric wiring for lighting and other medical equipment?']) || 0,
    rooms: Number(row['Q52. How many of these buildings are staff quarters?']) || 0,
    roomsWithConnection: row['Q53. Is there a power supply at staff houses in this health facility?']?.toLowerCase() === 'yes' 
      ? Number(row['Q52. How many of these buildings are staff quarters?']) || 0 
      : 0,
  },
  equipment: [],
  infrastructure: {
    waterAccess: !!row['Q37. How many water pumps are being used in the facility to access water ?'],
    nationalGrid: (row['Q12. What is the main source of electricity for the clinic?'] || '')
      .toLowerCase()
      .includes('grid'),
    transportationAccess: (row['Q18. Transport access'] as TransportAccess) || null,
    communication: row['Q34. Is there a functioning mobile or landline phone at the facility today owned by facility (not staff member)?'] || null,
    digitalConnectivity: row['Q19. Internet connectivity'] || null,
  },
  secondaryElectricitySource: row['Q24. What is the secondary/backup source of electricity for the facility?'] || null,
  monthlyDieselCost: Number(row['Q27. How much is the monthly cost of diesel fuel for the health facility on average?']) || null,
  monthlyFuelConsumption: Number(row['Q28. What is the fuel consumption per month(worst scenario) in liters?']) || null,
  annualMaintenanceCost: Number(row['Q29. On average, how much does the facility spend on servicing the diesel generator every year?']) || null,
  electricityMaintenanceProvider: row['Q30. Who provides operations and maintenance for the source of electricity at the facility?'] || null,
  hasFacilityPhone: row['Q34. Is there a functioning mobile or landline phone at the facility today owned by facility (not staff member)?']?.toLowerCase() === 'yes',
  numberOfWaterPumps: Number(row['Q37. How many water pumps are being used in the facility to access water ?']) || null,
  waterPumpPowerSource: row['Q38. What is the main source of power for the water pumps at the health facility?'] || null,
  waterTreatmentMethod: row['Q40. What is the main water treatment method used in the facility?'] || null,
  inpatientOutpatient: row['Q42 Does the facility take inpatients and outpatients?'] || null,
  numberOfBeds: Number(row['Q43. How many beds does the health facility have for overnight patient care?']) || null,
  mostImportantNeed: row['Q46. What do you think is the facility\'s most important need in terms of providing better health services?'] || null,
  averageMonthlyPatients: Number(row['Q50. On average, how many patients were attended to by the facility per month?']) || null,
  numberOfBuildings: Number(row['Q51. How many separate buildings does the facility have?']) || null,
  numberOfStaffQuarters: Number(row['Q52. How many of these buildings are staff quarters?']) || null,
  staffQuartersPowered: row['Q53. Is there a power supply at staff houses in this health facility?']?.toLowerCase() === 'yes',
  departmentsNeedingSockets: getArray(row['Q65. Which departments need electric sockets for using additional medical equipment? (mark all that apply)']),
  futureEquipmentNeeds: getArray(row['Q67. Which equipment would the health facility consider to have if there was available and reliable electricity on site?']),
});

// Export the model type for use in other files
export type SurveyModel = SurveyModelStatic;

/**
 * Initialize the Survey model and its associations
 */
export function initSurveyModel(sequelize: Sequelize): SurveyModelStatic {
  const Survey = sequelize.define<SurveyInstance>('Survey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    externalId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'externalId', // Explicitly map to database column name
      comment: 'External system identifier for this survey',
      unique: 'externalId_unique_constraint'
    },
    facilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'facilities',
        key: 'id',
      },
    },
    facilityData: {
      type: DataTypes.JSONB, // Using JSONB for better querying
      allowNull: false,
      validate: {
        // Custom validator that works across both PostgreSQL and SQLite
        isValidJSON(value: any) {
          if (typeof value === 'string') {
            try {
              JSON.parse(value);
            } catch (e) {
              throw new Error('Invalid JSON format for facilityData');
            }
          }
        }
      }
    },
    rawData: {
      type: DataTypes.JSONB, // Store original KoboToolbox survey responses
      allowNull: true,
      comment: 'Original raw survey data from KoboToolbox for preserving all question responses'
    },
    collectionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date when the survey was collected'
    },
    respondentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Identifier for the person who completed the survey'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'surveys',
    timestamps: true,
    indexes: [
      { fields: ['facilityId'] },
      { fields: ['collectionDate'] },
      { fields: ['externalId'], unique: true }
    ]
  });

  // Cast the model to our extended type
  const surveyModel = Survey as unknown as SurveyModelStatic;
  
  // Define associations
  surveyModel.associate = (models: any) => {
    surveyModel.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility'
    });
  };

  /**
   * Find a survey by external ID
   */
  surveyModel.findByExternalId = async (externalId: string): Promise<SurveyInstance | null> => {
    return surveyModel.findOne({ where: { externalId } });
  };

  /**
   * Find all surveys for a facility
   */
  surveyModel.findByFacility = async (facilityId: number): Promise<SurveyInstance[]> => {
    return surveyModel.findAll({ 
      where: { facilityId },
      order: [['collectionDate', 'DESC']] // Most recent first
    });
  };

  /**
   * Find the most recent survey for a facility
   */
  surveyModel.findLatestForFacility = async (facilityId: number): Promise<SurveyInstance | null> => {
    return surveyModel.findOne({
      where: { facilityId },
      order: [['collectionDate', 'DESC']],
      limit: 1
    });
  };

  return surveyModel;
};
