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
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var solarSystem_1 = require("../models/solarSystem");
var maintenanceRecord_1 = require("../models/maintenanceRecord");
var errorHandler_1 = require("../middleware/errorHandler");
var services_1 = require("../services");
var router = (0, express_1.Router)();
// Solar System Routes - Using kebab-case for URLs and consistent parameter naming
router.post('/', auth_1.verifyToken, auth_1.verifyPermission, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, system, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = req.body;
                return [4 /*yield*/, solarSystem_1.SolarSystem.create({
                        facilityId: data.facilityId,
                        systemType: data.systemType,
                        capacityKw: data.capacityKw,
                        installationDate: new Date(data.installationDate),
                        commissioningDate: new Date(data.commissioningDate),
                        manufacturer: data.manufacturer,
                        model: data.model,
                        serialNumber: data.serialNumber,
                        warrantyPeriod: data.warrantyPeriod,
                        maintenanceSchedule: data.maintenanceSchedule,
                        maintenanceFrequency: data.maintenanceFrequency,
                        status: 'ACTIVE',
                        lastMaintenanceDate: new Date(),
                        nextMaintenanceDate: new Date(),
                        performanceMetrics: {
                            dailyGeneration: 0,
                            monthlyGeneration: 0,
                            yearlyGeneration: 0,
                            efficiency: 0,
                            maintenanceCosts: {
                                total: 0,
                                averagePerKw: 0,
                                trend: 'STABLE'
                            },
                            operationalHours: 0,
                            downtime: {
                                totalHours: 0,
                                percentage: 0,
                                frequency: 0
                            },
                            energyLoss: {
                                totalKwh: 0,
                                percentage: 0,
                                causes: []
                            },
                            systemAvailability: 0,
                            performanceRatio: 0,
                            capacityFactor: 0
                        },
                        fundingSource: data.fundingSource,
                        grantAmount: data.grantAmount,
                        grantExpiryDate: new Date(data.grantExpiryDate),
                        installationCost: data.installationCost,
                        maintenanceCost: data.maintenanceCost
                    })];
            case 1:
                system = _a.sent();
                res.status(201).json(system);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_1, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var systems, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, solarSystem_1.SolarSystem.findAll({
                        where: { facilityId: parseInt(req.query.facilityId) },
                        order: [['installationDate', 'DESC']]
                    })];
            case 1:
                systems = _a.sent();
                res.json(systems);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_2, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/:systemId', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var system, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, solarSystem_1.SolarSystem.findByPk(req.params.systemId, {
                        include: ['facility', 'maintenanceRecords']
                    })];
            case 1:
                system = _a.sent();
                if (!system) {
                    throw new Error('System not found');
                }
                res.json(system);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_3, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/:systemId', auth_1.verifyToken, auth_1.verifyPermission, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var system, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, solarSystem_1.SolarSystem.findByPk(req.params.systemId)];
            case 1:
                system = _a.sent();
                if (!system) {
                    throw new Error('System not found');
                }
                return [4 /*yield*/, system.update(req.body)];
            case 2:
                _a.sent();
                res.json(system);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_4, req, res, function () { });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.delete('/:systemId', auth_1.verifyToken, auth_1.verifyAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var system, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, solarSystem_1.SolarSystem.findByPk(req.params.systemId)];
            case 1:
                system = _a.sent();
                if (!system) {
                    throw new Error('System not found');
                }
                return [4 /*yield*/, system.destroy()];
            case 2:
                _a.sent();
                res.status(204).send();
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_5, req, res, function () { });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Maintenance Record Routes
router.post('/:systemId/maintenance', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, record, error_6;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                data = req.body;
                return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.create({
                        solarSystemId: parseInt(req.params.systemId),
                        userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 0,
                        maintenanceDate: new Date(data.maintenanceDate || new Date()),
                        maintenanceType: data.maintenanceType,
                        maintenanceStatus: 'PENDING',
                        maintenanceDescription: data.maintenanceDescription,
                        maintenanceCost: data.maintenanceCost,
                        partsReplaced: data.partsReplaced || [],
                        laborHours: data.laborHours || 0,
                        nextMaintenanceDate: new Date(data.nextMaintenanceDate || new Date()),
                        maintenanceReport: data.maintenanceReport || '',
                        attachments: data.attachments || [],
                        preventiveTasks: data.preventiveTasks || [],
                        correctiveActions: data.correctiveActions || [],
                        systemImpact: data.systemImpact || 'MINOR',
                        downtimeHours: data.downtimeHours || 0,
                        preventiveMaintenance: data.preventiveMaintenance || false
                    })];
            case 1:
                record = _b.sent();
                res.status(201).json(record);
                return [3 /*break*/, 3];
            case 2:
                error_6 = _b.sent();
                errorHandler_1.errorHandler.handleError(error_6, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/:systemId/maintenance', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var records, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findAll({
                        where: { solarSystemId: req.params.systemId },
                        order: [['maintenanceDate', 'DESC']]
                    })];
            case 1:
                records = _a.sent();
                res.json(records);
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_7, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/:systemId/maintenance/:recordId', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var record, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findByPk(req.params.recordId)];
            case 1:
                record = _a.sent();
                if (!record) {
                    throw new Error('Maintenance record not found');
                }
                return [4 /*yield*/, record.update(req.body)];
            case 2:
                _a.sent();
                res.json(record);
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_8, req, res, function () { });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.delete('/:systemId/maintenance/:recordId', auth_1.verifyToken, auth_1.verifyPermission, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var record, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findByPk(req.params.recordId)];
            case 1:
                record = _a.sent();
                if (!record) {
                    throw new Error('Maintenance record not found');
                }
                return [4 /*yield*/, record.destroy()];
            case 2:
                _a.sent();
                res.status(204).send();
                return [3 /*break*/, 4];
            case 3:
                error_9 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_9, req, res, function () { });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// System Performance Routes
router.get('/:systemId/performance', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var system, metrics, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, solarSystem_1.SolarSystem.findByPk(req.params.systemId)];
            case 1:
                system = _a.sent();
                if (!system) {
                    throw new Error('System not found');
                }
                return [4 /*yield*/, services_1.maintenanceAnalytics.calculateSystemMetrics(req.params.id)];
            case 2:
                metrics = _a.sent();
                res.json(metrics);
                return [3 /*break*/, 4];
            case 3:
                error_10 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_10, req, res, function () { });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Maintenance Schedule Routes
router.get('/:id/schedule', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var schedule, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, services_1.maintenanceScheduler.getMaintenanceSchedule()];
            case 1:
                schedule = _a.sent();
                res.json(schedule);
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_11, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post('/:id/schedule/optimize', auth_1.verifyToken, auth_1.verifyAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, services_1.maintenanceScheduler.optimizeMaintenanceSchedule()];
            case 1:
                _a.sent();
                res.status(200).json({ message: 'Maintenance schedule optimized successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_12 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_12, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// System Status Routes
router.get('/:id/status', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, services_1.maintenanceAnalytics.calculateSystemStatus(req.params.id)];
            case 1:
                status_1 = _a.sent();
                res.json(status_1);
                return [3 /*break*/, 3];
            case 2:
                error_13 = _a.sent();
                errorHandler_1.errorHandler.handleError(error_13, req, res, function () { });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Analytics Routes
router.get('/:id/analytics', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var system, analytics, error_14;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                return [4 /*yield*/, solarSystem_1.SolarSystem.findByPk(req.params.id)];
            case 1:
                system = _b.sent();
                if (!system) {
                    throw new Error('System not found');
                }
                _a = {};
                return [4 /*yield*/, services_1.maintenanceAnalytics.calculateSystemMetrics(req.params.id)];
            case 2:
                _a.performance = _b.sent();
                return [4 /*yield*/, services_1.maintenanceAnalytics.calculateSystemStatus(req.params.id)];
            case 3:
                _a.status = _b.sent();
                return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findAll({
                        where: { solarSystemId: req.params.id },
                        order: [['maintenanceDate', 'DESC']],
                        limit: 10
                    })];
            case 4:
                analytics = (_a.maintenanceHistory = _b.sent(),
                    _a);
                res.json(analytics);
                return [3 /*break*/, 6];
            case 5:
                error_14 = _b.sent();
                errorHandler_1.errorHandler.handleError(error_14, req, res, function () { });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Reports Routes
router.get('/:id/reports', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var system, reports, error_15;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                return [4 /*yield*/, solarSystem_1.SolarSystem.findByPk(req.params.id)];
            case 1:
                system = _b.sent();
                if (!system) {
                    throw new Error('System not found');
                }
                _a = {};
                return [4 /*yield*/, maintenanceRecord_1.MaintenanceRecord.findAll({
                        where: { solarSystemId: req.params.id },
                        order: [['maintenanceDate', 'DESC']]
                    })];
            case 2:
                _a.maintenance = _b.sent();
                return [4 /*yield*/, services_1.maintenanceAnalytics.calculateSystemMetrics(req.params.id)];
            case 3:
                _a.performance = _b.sent();
                return [4 /*yield*/, services_1.maintenanceAnalytics.calculateDowntime(req.params.id)];
            case 4:
                reports = (_a.downtime = _b.sent(),
                    _a);
                res.json(reports);
                return [3 /*break*/, 6];
            case 5:
                error_15 = _b.sent();
                errorHandler_1.errorHandler.handleError(error_15, req, res, function () { });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
