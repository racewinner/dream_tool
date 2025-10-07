import dotenv from 'dotenv';
dotenv.config();

import { ModelStatic } from 'sequelize';
// Import the shared Sequelize instance
// Using PostgreSQL for production DREAM TOOL
import sequelize from '../config/database';

// Import model initializers and types
console.log('[models/index.ts] Importing User...');
import { initUserModel, UserInstance } from './user';
console.log('[models/index.ts]  -> User imported.');

console.log('[models/index.ts] Importing Facility...');
import { initFacilityModel, FacilityInstance } from './facility';
console.log('[models/index.ts]  -> Facility imported.');

console.log('[models/index.ts] Importing Asset...');
import { initAssetModel, AssetInstance } from './asset';
console.log('[models/index.ts]  -> Asset imported.');

console.log('[models/index.ts] Importing Equipment...');
import { initEquipmentModel, EquipmentInstance } from './equipment';
console.log('[models/index.ts]  -> Equipment imported.');

console.log('[models/index.ts] Importing Survey...');
import { initSurveyModel, SurveyInstance } from './survey';
console.log('[models/index.ts]  -> Survey imported.');

console.log('[models/index.ts] Importing SolarSystem...');
import { initSolarSystemModel, SolarSystemInstance } from './solarSystem';
console.log('[models/index.ts]  -> SolarSystem imported.');

console.log('[models/index.ts] Importing SurveyVersion...');
import { initSurveyVersionModel, SurveyVersionInstance } from './surveyVersion';
console.log('[models/index.ts]  -> SurveyVersion imported.');

console.log('[models/index.ts] Importing Maintenance...');
import { initMaintenanceModel, MaintenanceInstance } from './maintenance';
console.log('[models/index.ts]  -> Maintenance imported.');

console.log('[models/index.ts] Importing MaintenanceRecord...');
import { initMaintenanceRecordModel, MaintenanceRecordInstance } from './maintenanceRecord';
console.log('[models/index.ts]  -> MaintenanceRecord imported.');

console.log('[models/index.ts] Importing RawImport...');
import { initRawImportModel, RawImportInstance } from './rawImport';
console.log('[models/index.ts]  -> RawImport imported.');

console.log('[models/index.ts] Importing TechnoEconomicAnalysis...');
import { initTechnoEconomicAnalysisModel, TechnoEconomicAnalysisInstance } from './technoEconomicAnalysis';
console.log('[models/index.ts]  -> TechnoEconomicAnalysis imported.');

// console.log('[models/index.ts] Importing Weather...');
// import { initWeatherModel, WeatherInstance } from './weather';
// console.log('[models/index.ts]  -> Weather imported.');

console.log('[models/index.ts] Importing WhatsApp...');
import { initWhatsAppModel, WhatsAppInstance } from './whatsapp';
console.log('[models/index.ts]  -> WhatsApp imported.');


console.log('Using database configuration from config/database.ts');


// Initialize models
type ModelType = {
  [key: string]: ModelStatic<any>;
};

// Initialize models with the sequelize instance
console.log('[models/index.ts] Initializing models...');
const db: ModelType = {
  User: (console.log('[models/index.ts]  -> Initializing User...'), initUserModel(sequelize)),
  Facility: (console.log('[models/index.ts]  -> Initializing Facility...'), initFacilityModel(sequelize)),
  Asset: (console.log('[models/index.ts]  -> Initializing Asset...'), initAssetModel(sequelize)),
  Equipment: (console.log('[models/index.ts]  -> Initializing Equipment...'), initEquipmentModel(sequelize)),
  Survey: (console.log('[models/index.ts]  -> Initializing Survey...'), initSurveyModel(sequelize)),
  SurveyVersion: (console.log('[models/index.ts]  -> Initializing SurveyVersion...'), initSurveyVersionModel(sequelize)),
  SolarSystem: (console.log('[models/index.ts]  -> Initializing SolarSystem...'), initSolarSystemModel(sequelize)),
  Maintenance: (console.log('[models/index.ts]  -> Initializing Maintenance...'), initMaintenanceModel(sequelize)),
  MaintenanceRecord: (console.log('[models/index.ts]  -> Initializing MaintenanceRecord...'), initMaintenanceRecordModel(sequelize)),
  RawImport: (() => {
    console.log('[models/index.ts]  -> Initializing RawImport...');
    try {
      const model = initRawImportModel(sequelize);
      console.log('[models/index.ts]  -> RawImport model initialized successfully');
      return model;
    } catch (error) {
      console.error('[models/index.ts]  -> Error initializing RawImport model:', error);
      throw error;
    }
  })(),
  TechnoEconomicAnalysis: (console.log('[models/index.ts]  -> Initializing TechnoEconomicAnalysis...'), initTechnoEconomicAnalysisModel(sequelize)),
  WhatsApp: (console.log('[models/index.ts]  -> Initializing WhatsApp...'), initWhatsAppModel(sequelize)),
};

// Initialize all models
Object.values(db).forEach((model: any) => {
  if (model.initialize) {
    console.log(`[models/index.ts]  -> Initializing ${model.name}...`);
    model.initialize(sequelize);
  }
});

console.log('[models/index.ts] All models initialized.');

// Establish associations
Object.values(db).forEach((model: any) => {
  // User associations
  if (model.name === 'User') {
    model.hasMany(db.Facility, { foreignKey: 'userId' });
    model.hasMany(db.Survey, { foreignKey: 'createdBy' });
  }

  // Facility associations
  if (model.name === 'Facility') {
    model.belongsTo(db.User, { foreignKey: 'userId' });
    model.hasMany(db.Asset, { foreignKey: 'facilityId' });
    model.hasMany(db.Survey, { foreignKey: 'facilityId' });
    model.hasMany(db.SolarSystem, { foreignKey: 'facilityId' });
    // model.hasMany(db.Weather, { foreignKey: 'facilityId' }); // Weather model disabled
  }

  // Asset associations
  if (model.name === 'Asset') {
    model.belongsTo(db.Facility, { foreignKey: 'facilityId', as: 'facility' });
    model.hasMany(db.Maintenance, { foreignKey: 'assetId', as: 'maintenances' });
  }

  // Survey associations
  if (model.name === 'Survey') {
    model.belongsTo(db.Facility, { foreignKey: 'facilityId' });
    // model.hasMany(db.SurveyVersion, { foreignKey: 'surveyId' });
  }

  // SurveyVersion associations
  // if (model.name === 'SurveyVersion') {
  //   model.belongsTo(db.Survey, { foreignKey: 'surveyId' });
  // }

  // SolarSystem associations (disabled)
  if (model.name === 'SolarSystem') {
    model.belongsTo(db.Facility, { foreignKey: 'facilityId' });
    model.hasMany(db.Maintenance, { foreignKey: 'systemId' });
    // model.hasOne(db.TechnoEconomicAnalysis, { foreignKey: 'systemId' });
  }

  // Maintenance associations
  if (model.name === 'Maintenance') {
    model.belongsTo(db.SolarSystem, { foreignKey: 'systemId' });
    model.hasMany(db.MaintenanceRecord, { foreignKey: 'maintenanceId' });
  }

  // MaintenanceRecord associations
  if (model.name === 'MaintenanceRecord') {
    model.belongsTo(db.Maintenance, { foreignKey: 'maintenanceId' });
  }

  // TechnoEconomicAnalysis associations (disabled)
  // if (model.name === 'TechnoEconomicAnalysis') {
  //   model.belongsTo(db.SolarSystem, { foreignKey: 'systemId' });
  // }

  // Weather associations (disabled)
  // if (model.name === 'Weather') {
  //   model.belongsTo(db.Facility, { foreignKey: 'facilityId' });
  // }
});

/**
 * Synchronizes all defined models to the database.
 * This function should be called once at application startup.
 */
export const initializeDatabase = async () => {
  try {
    console.log('[DB] Synchronizing database schema...');
    
    // First, sync all models
    const { RawImport, ...otherModels } = db;
    await sequelize.sync({ alter: true, force: false });
    
    // Then, sync RawImport separately with force: true to ensure table is created
    console.log('[DB] Syncing RawImport table...');
    await RawImport.sync({ force: true });
    
    console.log('[DB] Database synchronized successfully.');
  } catch (error) {
    console.error('[DB] Failed to synchronize database:', error);
    throw error;
  }
};

// Extract model instances for easier access
const {
  User,
  Facility,
  Asset,
  Equipment,
  Survey,
  SurveyVersion,
  Maintenance,
  MaintenanceRecord,
  SolarSystem,
  RawImport,
  TechnoEconomicAnalysis,
  // Weather,
  WhatsApp
} = db;

// Export all models and the models object for debugging
export {
  sequelize,
  User,
  Facility,
  Asset,
  Equipment,
  Survey,
  SurveyVersion,
  Maintenance,
  MaintenanceRecord,
  SolarSystem,
  RawImport,
  TechnoEconomicAnalysis,
  // Weather,
  WhatsApp,
  db, // Export the models object for debugging
};

// Export model types
export type {
  UserInstance,
  FacilityInstance,
  AssetInstance,
  EquipmentInstance,
  SurveyInstance,
  SurveyVersionInstance,
  SolarSystemInstance,
  MaintenanceInstance,
  MaintenanceRecordInstance,
  RawImportInstance,
  TechnoEconomicAnalysisInstance,
  WhatsAppInstance,
  // WeatherInstance,
};
