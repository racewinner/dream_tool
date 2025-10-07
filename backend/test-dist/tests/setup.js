"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestServer = exports.getTestToken = exports.createTestData = exports.clearTestDatabase = exports.setupTestDatabase = void 0;
var config_1 = require("../config");
var ioredis_1 = require("ioredis");
var sequelize_1 = require("sequelize");
var user_1 = require("../models/user");
var facility_1 = require("../models/facility");
var survey_1 = require("../models/survey");
var techno_economic_analysis_1 = require("../models/techno-economic-analysis");
// Test database configuration
var testConfig = __assign(__assign({}, config_1.config.database), { database: "".concat(config_1.config.database.database, "_test") });
// Test Redis configuration
var testRedis = new ioredis_1.Redis(__assign(__assign({}, config_1.config.redis), { prefix: 'test:' }));
// Test database connection
var testDb = new sequelize_1.Sequelize(__assign(__assign({}, testConfig), { logging: false }));
// Test models
var testModels = {
    User: user_1.User.init(testDb),
    Facility: facility_1.Facility.init(testDb),
    Survey: survey_1.Survey.init(testDb),
    TechnoEconomicAnalysis: techno_economic_analysis_1.TechnoEconomicAnalysis.init(testDb)
};
// Helper functions
var setupTestDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                // Drop existing database
                return [4 /*yield*/, testDb.drop({ cascade: true })];
            case 1:
                // Drop existing database
                _a.sent();
                // Create tables
                return [4 /*yield*/, testDb.sync({ force: true })];
            case 2:
                // Create tables
                _a.sent();
                // Create test data
                return [4 /*yield*/, (0, exports.createTestData)()];
            case 3:
                // Create test data
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error('Error setting up test database:', error_1);
                throw error_1;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.setupTestDatabase = setupTestDatabase;
var clearTestDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // Clear Redis
                return [4 /*yield*/, testRedis.flushall()];
            case 1:
                // Clear Redis
                _a.sent();
                // Drop tables
                return [4 /*yield*/, testDb.drop({ cascade: true })];
            case 2:
                // Drop tables
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('Error clearing test database:', error_2);
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.clearTestDatabase = clearTestDatabase;
var createTestData = function () { return __awaiter(void 0, void 0, void 0, function () {
    var admin, user, facility, survey, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                return [4 /*yield*/, testModels.User.create({
                        email: 'admin@test.com',
                        password: 'test123',
                        role: 'admin',
                        firstName: 'Admin',
                        lastName: 'User'
                    })];
            case 1:
                admin = _a.sent();
                return [4 /*yield*/, testModels.User.create({
                        email: 'user@test.com',
                        password: 'test123',
                        role: 'user',
                        firstName: 'Regular',
                        lastName: 'User'
                    })];
            case 2:
                user = _a.sent();
                return [4 /*yield*/, testModels.Facility.create({
                        name: 'Test Facility',
                        address: '123 Test St',
                        city: 'Test City',
                        state: 'Test State',
                        country: 'Test Country',
                        userId: admin.id
                    })];
            case 3:
                facility = _a.sent();
                return [4 /*yield*/, testModels.Survey.create({
                        name: 'Test Survey',
                        description: 'Test survey data',
                        facilityId: facility.id,
                        userId: admin.id,
                        data: {
                            equipment: [
                                { type: 'PV', capacity: 100 },
                                { type: 'Battery', capacity: 50 }
                            ]
                        }
                    })];
            case 4:
                survey = _a.sent();
                // Create test analysis
                return [4 /*yield*/, testModels.TechnoEconomicAnalysis.create({
                        facilityId: facility.id,
                        dailyUsage: 100,
                        peakHours: 8,
                        batteryAutonomyFactor: 0.8,
                        batteryDepthOfDischarge: 0.8,
                        batteryType: 'lithium',
                        inverterEfficiency: 0.95,
                        costingMethod: 'perWatt',
                        panelCostPerWatt: 0.5,
                        panelCostPerKw: 500,
                        userId: admin.id
                    })];
            case 5:
                // Create test analysis
                _a.sent();
                return [2 /*return*/, {
                        admin: admin,
                        user: user,
                        facility: facility,
                        survey: survey
                    }];
            case 6:
                error_3 = _a.sent();
                console.error('Error creating test data:', error_3);
                throw error_3;
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createTestData = createTestData;
var getTestToken = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var token, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, testModels.User.generateToken(user)];
            case 1:
                token = _a.sent();
                return [2 /*return*/, token];
            case 2:
                error_4 = _a.sent();
                console.error('Error generating test token:', error_4);
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getTestToken = getTestToken;
var setupTestServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Initialize database
                return [4 /*yield*/, (0, exports.setupTestDatabase)()];
            case 1:
                // Initialize database
                _a.sent();
                // Return test utilities
                return [2 /*return*/, {
                        db: testDb,
                        models: testModels,
                        redis: testRedis,
                        clear: exports.clearTestDatabase
                    }];
            case 2:
                error_5 = _a.sent();
                console.error('Error setting up test server:', error_5);
                throw error_5;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.setupTestServer = setupTestServer;
