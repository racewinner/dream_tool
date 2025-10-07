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
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceScheduler = exports.MaintenanceScheduler = void 0;
var solarSystem_1 = require("../models/solarSystem");
var maintenanceRecord_1 = require("../models/maintenanceRecord");
var errorHandler_1 = require("../middleware/errorHandler");
var MaintenanceScheduler = /** @class */ (function () {
    function MaintenanceScheduler() {
        this.MAINTENANCE_WINDOW = 7; // days
        this.MAX_MAINTENANCE_TASKS = 5;
        this.MIN_MAINTENANCE_INTERVAL = 30; // days
    }
    MaintenanceScheduler.getInstance = function () {
        if (!MaintenanceScheduler.instance) {
            MaintenanceScheduler.instance = new MaintenanceScheduler();
        }
        return MaintenanceScheduler.instance;
    };
    MaintenanceScheduler.prototype.scheduleMaintenance = function (systemId) {
        return __awaiter(this, void 0, void 0, function () {
            var system, records, status_1, maintenanceType, nextDate, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, solarSystem_1.SolarSystem.findByPk(systemId)];
                    case 1:
                        system = _a.sent();
                        if (!system) {
                            throw new Error('System not found');
                        }
                        return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findAll({
                                where: { solarSystemId: systemId },
                                order: [['maintenanceDate', 'DESC']]
                            })];
                    case 2:
                        records = _a.sent();
                        return [4 /*yield*/, maintenanceAnalytics.calculateSystemStatus(systemId)];
                    case 3:
                        status_1 = _a.sent();
                        maintenanceType = this.determineMaintenanceType(status_1);
                        nextDate = this.calculateNextMaintenanceDate(system, records, maintenanceType);
                        // Create maintenance record
                        return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.create({
                                solarSystemId: systemId,
                                maintenanceType: maintenanceType,
                                maintenanceDate: nextDate,
                                maintenanceStatus: 'PENDING',
                                maintenanceDescription: this.generateMaintenanceDescription(status_1, maintenanceType)
                            })];
                    case 4:
                        // Create maintenance record
                        _a.sent();
                        // Update system status
                        return [4 /*yield*/, system.update({
                                nextMaintenanceDate: nextDate,
                                status: maintenanceType === 'EMERGENCY' ? 'MAINTENANCE' : 'ACTIVE'
                            })];
                    case 5:
                        // Update system status
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        errorHandler_1.ErrorHandler.handleError(error_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    MaintenanceScheduler.prototype.optimizeMaintenanceSchedule = function () {
        return __awaiter(this, void 0, void 0, function () {
            var systems, _i, systems_1, system, records, status_2, maintenanceType, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, solarSystem_1.SolarSystem.findAll({
                                where: {
                                    status: 'ACTIVE'
                                }
                            })];
                    case 1:
                        systems = _a.sent();
                        _i = 0, systems_1 = systems;
                        _a.label = 2;
                    case 2:
                        if (!(_i < systems_1.length)) return [3 /*break*/, 7];
                        system = systems_1[_i];
                        return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findAll({
                                where: { solarSystemId: system.id },
                                order: [['maintenanceDate', 'DESC']]
                            })];
                    case 3:
                        records = _a.sent();
                        return [4 /*yield*/, maintenanceAnalytics.calculateSystemStatus(system.id)];
                    case 4:
                        status_2 = _a.sent();
                        maintenanceType = this.determineMaintenanceType(status_2);
                        if (!this.shouldScheduleMaintenance(status_2, records)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.scheduleMaintenance(system.id)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_2 = _a.sent();
                        errorHandler_1.ErrorHandler.handleError(error_2);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    MaintenanceScheduler.prototype.determineMaintenanceType = function (status) {
        if (status.riskLevel === 'CRITICAL')
            return 'EMERGENCY';
        if (status.healthScore < 70)
            return 'CORRECTIVE';
        if (status.upcomingMaintenance.count >= this.MAX_MAINTENANCE_TASKS)
            return 'SEASONAL';
        return 'ROUTINE';
    };
    MaintenanceScheduler.prototype.calculateNextMaintenanceDate = function (system, records, maintenanceType) {
        var _a;
        var lastMaintenance = ((_a = records[0]) === null || _a === void 0 ? void 0 : _a.maintenanceDate) || new Date();
        var frequency = this.getMaintenanceFrequency(maintenanceType);
        var nextDate = new Date(lastMaintenance);
        nextDate.setDate(nextDate.getDate() + frequency);
        // Ensure maintenance window
        if (new Date(nextDate) < new Date(Date.now() + this.MAINTENANCE_WINDOW * 24 * 60 * 60 * 1000)) {
            nextDate.setDate(nextDate.getDate() + this.MAINTENANCE_WINDOW);
        }
        return nextDate;
    };
    MaintenanceScheduler.prototype.getMaintenanceFrequency = function (maintenanceType) {
        switch (maintenanceType) {
            case 'ROUTINE':
                return 30; // monthly
            case 'PREVENTIVE':
                return 90; // quarterly
            case 'SEASONAL':
                return 180; // semi-annual
            case 'ANNUAL':
                return 365; // yearly
            default:
                return 30; // default to monthly
        }
    };
    MaintenanceScheduler.prototype.shouldScheduleMaintenance = function (status, records) {
        // Check if maintenance is overdue
        if (status.maintenanceSchedule.overdue)
            return true;
        // Check if system has high risk level
        if (status.riskLevel === 'CRITICAL')
            return true;
        // Check if system has low health score
        if (status.healthScore < 70)
            return true;
        // Check if maintenance frequency is met
        if (records.length === 0)
            return true;
        var lastMaintenance = new Date(records[0].maintenanceDate);
        var now = new Date();
        var daysSinceLast = (now.getTime() - lastMaintenance.getTime()) /
            (1000 * 60 * 60 * 24);
        return daysSinceLast >= this.MIN_MAINTENANCE_INTERVAL;
    };
    MaintenanceScheduler.prototype.generateMaintenanceDescription = function (status, maintenanceType) {
        var baseDescription = "Scheduled ".concat(maintenanceType.toLowerCase(), " maintenance");
        if (status.riskLevel === 'CRITICAL') {
            return "".concat(baseDescription, " - Critical system issues identified");
        }
        if (status.healthScore < 70) {
            return "".concat(baseDescription, " - System health score below threshold");
        }
        if (status.upcomingMaintenance.count >= this.MAX_MAINTENANCE_TASKS) {
            return "".concat(baseDescription, " - Multiple maintenance tasks pending");
        }
        return baseDescription;
    };
    MaintenanceScheduler.prototype.getMaintenanceSchedule = function () {
        return __awaiter(this, void 0, void 0, function () {
            var systems, schedule, _i, systems_2, system, records, status_3, nextDate, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, solarSystem_1.SolarSystem.findAll()];
                    case 1:
                        systems = _a.sent();
                        schedule = [];
                        _i = 0, systems_2 = systems;
                        _a.label = 2;
                    case 2:
                        if (!(_i < systems_2.length)) return [3 /*break*/, 6];
                        system = systems_2[_i];
                        return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findAll({
                                where: { solarSystemId: system.id },
                                order: [['maintenanceDate', 'DESC']]
                            })];
                    case 3:
                        records = _a.sent();
                        return [4 /*yield*/, maintenanceAnalytics.calculateSystemStatus(system.id)];
                    case 4:
                        status_3 = _a.sent();
                        nextDate = this.calculateNextMaintenanceDate(system, records, this.determineMaintenanceType(status_3));
                        schedule.push({
                            systemId: system.id,
                            facility: system.facility.name,
                            maintenanceType: this.determineMaintenanceType(status_3),
                            nextDate: nextDate,
                            priority: this.calculatePriority(status_3)
                        });
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/, schedule.sort(function (a, b) { return b.priority - a.priority; })];
                    case 7:
                        error_3 = _a.sent();
                        errorHandler_1.ErrorHandler.handleError(error_3);
                        return [2 /*return*/, []];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    MaintenanceScheduler.prototype.calculatePriority = function (status) {
        var priority = 1;
        if (status.riskLevel === 'CRITICAL')
            priority += 3;
        if (status.healthScore < 70)
            priority += 2;
        if (status.maintenanceSchedule.overdue)
            priority += 1;
        if (status.upcomingMaintenance.count >= this.MAX_MAINTENANCE_TASKS)
            priority += 2;
        return priority;
    };
    return MaintenanceScheduler;
}());
exports.MaintenanceScheduler = MaintenanceScheduler;
exports.maintenanceScheduler = MaintenanceScheduler.getInstance();
