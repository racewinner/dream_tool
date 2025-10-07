"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsApp = exports.Weather = exports.TechnoEconomicAnalysis = exports.SolarSystem = exports.MaintenanceRecord = exports.Maintenance = exports.SurveyVersion = exports.Survey = exports.Equipment = exports.Asset = exports.Facility = exports.User = exports.sequelize = void 0;
var sequelize_1 = require("sequelize");
var dotenv_1 = __importDefault(require("dotenv"));
// Import model initializers and types
var user_1 = require("./user");
var facility_1 = require("./facility");
var asset_1 = require("./asset");
var equipment_1 = require("./equipment");
var survey_1 = require("./survey");
var surveyVersion_1 = require("./surveyVersion");
var maintenance_1 = require("./maintenance");
var maintenanceRecord_1 = require("./maintenanceRecord");
var solarSystem_1 = require("./solarSystem");
var technoEconomicAnalysis_1 = require("./technoEconomicAnalysis");
var weather_1 = require("./weather");
var whatsapp_1 = require("./whatsapp");
dotenv_1.default.config();
console.log('Initializing database connection with config:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    username: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'dream_tool',
    password: process.env.DB_PASSWORD ? '***' : 'not set'
});
var sequelize = new sequelize_1.Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'dream_tool',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3,
        timeout: 30000, // 30 seconds
    }
});
exports.sequelize = sequelize;
// Test the database connection
function testConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, sequelize.authenticate()];
                case 1:
                    _a.sent();
                    console.log('Database connection has been established successfully.');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Unable to connect to the database:', error_1);
                    process.exit(1); // Exit with error if we can't connect to the database
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Call the test connection function
testConnection();
// Initialize models with the sequelize instance
var models = {
    User: (0, user_1.initUserModel)(sequelize),
    Facility: (0, facility_1.initFacilityModel)(sequelize),
    Asset: (0, asset_1.initAssetModel)(sequelize),
    Equipment: (0, equipment_1.initEquipmentModel)(sequelize),
    Survey: (0, survey_1.initSurveyModel)(sequelize),
    SurveyVersion: (0, surveyVersion_1.initSurveyVersionModel)(sequelize),
    Maintenance: (0, maintenance_1.initMaintenanceModel)(sequelize),
    MaintenanceRecord: (0, maintenanceRecord_1.initMaintenanceRecordModel)(sequelize),
    SolarSystem: (0, solarSystem_1.initSolarSystemModel)(sequelize),
    TechnoEconomicAnalysis: (0, technoEconomicAnalysis_1.initTechnoEconomicAnalysisModel)(sequelize),
    Weather: (0, weather_1.initWeatherModel)(sequelize),
    WhatsApp: (0, whatsapp_1.initWhatsAppModel)(sequelize)
};
// Extract model instances for easier access
var User = models.User, Facility = models.Facility, Asset = models.Asset, Equipment = models.Equipment, Survey = models.Survey, SurveyVersion = models.SurveyVersion, Maintenance = models.Maintenance, MaintenanceRecord = models.MaintenanceRecord, SolarSystem = models.SolarSystem, TechnoEconomicAnalysis = models.TechnoEconomicAnalysis, Weather = models.Weather, WhatsApp = models.WhatsApp;
exports.User = User;
exports.Facility = Facility;
exports.Asset = Asset;
exports.Equipment = Equipment;
exports.Survey = Survey;
exports.SurveyVersion = SurveyVersion;
exports.Maintenance = Maintenance;
exports.MaintenanceRecord = MaintenanceRecord;
exports.SolarSystem = SolarSystem;
exports.TechnoEconomicAnalysis = TechnoEconomicAnalysis;
exports.Weather = Weather;
exports.WhatsApp = WhatsApp;
// Define associations
// User associations
User.hasMany(Facility, { foreignKey: 'userId' });
User.hasMany(Survey, { foreignKey: 'createdBy' });
// Facility associations
Facility.belongsTo(User, { foreignKey: 'userId' });
Facility.hasMany(Asset, { foreignKey: 'facilityId' });
Facility.hasMany(Survey, { foreignKey: 'facilityId' });
Facility.hasMany(SolarSystem, { foreignKey: 'facilityId' });
Facility.hasMany(Weather, { foreignKey: 'facilityId' });
// Survey associations
Survey.belongsTo(Facility, { foreignKey: 'facilityId' });
Survey.hasMany(SurveyVersion, { foreignKey: 'surveyId' });
// SurveyVersion associations
SurveyVersion.belongsTo(Survey, { foreignKey: 'surveyId' });
// SolarSystem associations
SolarSystem.belongsTo(Facility, { foreignKey: 'facilityId' });
SolarSystem.hasMany(Maintenance, { foreignKey: 'systemId' });
SolarSystem.hasOne(TechnoEconomicAnalysis, { foreignKey: 'systemId' });
// Maintenance associations
Maintenance.belongsTo(SolarSystem, { foreignKey: 'systemId' });
Maintenance.hasMany(MaintenanceRecord, { foreignKey: 'maintenanceId' });
// MaintenanceRecord associations
MaintenanceRecord.belongsTo(Maintenance, { foreignKey: 'maintenanceId' });
// TechnoEconomicAnalysis associations
TechnoEconomicAnalysis.belongsTo(SolarSystem, { foreignKey: 'systemId' });
// Weather associations
Weather.belongsTo(Facility, { foreignKey: 'facilityId' });
