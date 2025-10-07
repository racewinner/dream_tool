export interface FacilityData {
  // === BASIC FACILITY INFORMATION ===
  name?: string;
  region?: string;
  district?: string;
  facilityType?: string;
  ownership?: string | null;
  catchmentPopulation?: number;
  
  // === OPERATIONAL INFORMATION ===
  operationalDays: number;
  operationalHours: {
    day: number;
    night: number;
  };
  coreServices: string[];
  inpatientOutpatient?: string | null;
  averageMonthlyPatients?: number | null;
  numberOfBeds?: number | null;
  
  // === STAFF INFORMATION ===
  supportStaff: number;
  technicalStaff: number;
  nightStaff: boolean;
  
  // === ELECTRICITY & POWER ===
  electricitySource?: string | null;
  electricityReliability?: string | null;
  electricityAvailability?: string | null;
  secondaryElectricitySource?: string | null;
  monthlyDieselCost?: number | null;
  monthlyFuelConsumption?: number | null;
  annualMaintenanceCost?: number | null;
  electricityMaintenanceProvider?: string | null;
  
  // === WATER & SANITATION ===
  numberOfWaterPumps?: number | null;
  waterPumpPowerSource?: string | null;
  waterTreatmentMethod?: string | null;
  
  // === COMMUNICATION ===
  hasFacilityPhone: boolean;
  
  // === BUILDINGS & INFRASTRUCTURE ===
  numberOfBuildings?: number | null;
  numberOfStaffQuarters?: number | null;
  staffQuartersPowered: boolean;
  buildings: {
    total: number;
    departmentsWithWiring: number;
    rooms: number;
    roomsWithConnection: number;
  };
  
  // === EQUIPMENT (KoboToolbox-compatible structure) ===
  equipment: Array<{
    name: string;
    department?: string;
    category?: string;
    quantity: number;
    hoursPerDay: number;
    timeOfUse?: string;
    frequency?: string;
    powerRating?: number;
    criticalForOperations?: boolean;
    powerConsumption?: number | null;
  }>;
  
  // === INFRASTRUCTURE ACCESS ===
  infrastructure: {
    waterAccess: boolean;
    nationalGrid: boolean;
    transportationAccess?: string | null;
    communication?: string | null;
    digitalConnectivity?: string | null;
  };
  
  // === NEEDS & REQUIREMENTS ===
  criticalNeeds: string[];
  mostImportantNeed?: string | null;
  departmentsNeedingSockets: string[];
  futureEquipmentNeeds: string[];
  
  // === PRODUCTIVE USE (Legacy fields) ===
  productiveSectors: string[];
  subsectorActivities: string[];
}
