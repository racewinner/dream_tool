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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceAnalytics = exports.MaintenanceAnalytics = void 0;
var solarSystem_1 = require("../models/solarSystem");
var maintenanceRecord_1 = require("../models/maintenanceRecord");
var MaintenanceAnalytics = /** @class */ (function () {
    function MaintenanceAnalytics() {
        this.DOWNTIME_THRESHOLD = 24; // hours
        this.ENERGY_LOSS_THRESHOLD = 0.05; // 5%
    }
    MaintenanceAnalytics.getInstance = function () {
        if (!MaintenanceAnalytics.instance) {
            MaintenanceAnalytics.instance = new MaintenanceAnalytics();
        }
        return MaintenanceAnalytics.instance;
    };
    MaintenanceAnalytics.prototype.calculateSystemMetrics = function (systemId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, system, records, metrics;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            solarSystem_1.SolarSystem.findByPk(systemId),
                            maintenanceRecord_1.MaintenanceRecord.findAll({ where: { solarSystemId: systemId } })
                        ])];
                    case 1:
                        _a = _c.sent(), system = _a[0], records = _a[1];
                        if (!system) {
                            throw new Error('System not found');
                        }
                        _b = {};
                        return [4 /*yield*/, this.calculateDailyGeneration(system)];
                    case 2:
                        _b.dailyGeneration = _c.sent();
                        return [4 /*yield*/, this.calculateMonthlyGeneration(system)];
                    case 3:
                        _b.monthlyGeneration = _c.sent();
                        return [4 /*yield*/, this.calculateYearlyGeneration(system)];
                    case 4:
                        _b.yearlyGeneration = _c.sent();
                        return [4 /*yield*/, this.calculateSystemEfficiency(system)];
                    case 5:
                        _b.efficiency = _c.sent();
                        return [4 /*yield*/, this.calculateMaintenanceCosts(records)];
                    case 6:
                        _b.maintenanceCosts = _c.sent();
                        return [4 /*yield*/, this.calculateOperationalHours(records)];
                    case 7:
                        _b.operationalHours = _c.sent();
                        return [4 /*yield*/, this.calculateDowntime(records)];
                    case 8:
                        _b.downtime = _c.sent();
                        return [4 /*yield*/, this.calculateEnergyLoss(system, records)];
                    case 9:
                        _b.energyLoss = _c.sent();
                        return [4 /*yield*/, this.calculateSystemAvailability(records)];
                    case 10:
                        _b.systemAvailability = _c.sent();
                        return [4 /*yield*/, this.calculatePerformanceRatio(system)];
                    case 11:
                        _b.performanceRatio = _c.sent();
                        return [4 /*yield*/, this.calculateCapacityFactor(system)];
                    case 12:
                        metrics = (_b.capacityFactor = _c.sent(),
                            _b);
                        return [2 /*return*/, metrics];
                }
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateSystemStatus = function (systemId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, system, records, status;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            solarSystem_1.SolarSystem.findByPk(systemId),
                            maintenanceRecord_1.MaintenanceRecord.findAll({
                                where: { solarSystemId: systemId },
                                order: [['maintenanceDate', 'DESC']]
                            })
                        ])];
                    case 1:
                        _a = _b.sent(), system = _a[0], records = _a[1];
                        if (!system) {
                            throw new Error('System not found');
                        }
                        status = {
                            operational: system.status === 'ACTIVE',
                            maintenanceRequired: system.status === 'MAINTENANCE',
                            performance: system.performanceMetrics.efficiency,
                            alerts: this.generateAlerts(system, records),
                            maintenanceSchedule: this.calculateMaintenanceSchedule(system),
                            healthScore: this.calculateHealthScore(system, records),
                            riskLevel: this.calculateRiskLevel(system, records),
                            upcomingMaintenance: this.calculateUpcomingMaintenance(records),
                            systemMetrics: this.calculateSystemMetrics(system, records),
                            recentIssues: this.calculateRecentIssues(records)
                        };
                        return [2 /*return*/, status];
                }
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateHealthScore = function (system, records) {
        var metrics = this.calculateSystemMetrics(system, records);
        var score = ((metrics.efficiency * 0.4) +
            (metrics.systemAvailability * 0.3) +
            (metrics.performanceRatio * 0.2) +
            (1 - metrics.downtime.percentage) * 0.1) * 100;
        return Math.round(score);
    };
    MaintenanceAnalytics.prototype.calculateRiskLevel = function (system, records) {
        var score = this.calculateHealthScore(system, records);
        if (score >= 90)
            return 'LOW';
        if (score >= 70)
            return 'MODERATE';
        if (score >= 50)
            return 'HIGH';
        return 'CRITICAL';
    };
    MaintenanceAnalytics.prototype.calculateUpcomingMaintenance = function (records) {
        var _a;
        var upcoming = records.filter(function (r) { return new Date(r.nextMaintenanceDate) > new Date(); });
        return {
            count: upcoming.length,
            nextDate: (_a = upcoming[0]) === null || _a === void 0 ? void 0 : _a.maintenanceDate,
            types: upcoming.map(function (r) { return r.maintenanceType; })
        };
    };
    MaintenanceAnalytics.prototype.calculateSystemMetrics = function (system, records) {
        var metrics = this.calculateSystemMetrics(system);
        return {
            efficiency: metrics.efficiency,
            availability: metrics.systemAvailability,
            reliability: this.calculateReliability(records),
            performance: metrics.performanceRatio
        };
    };
    MaintenanceAnalytics.prototype.calculateRecentIssues = function (records) {
        var recent = records.filter(function (r) { return new Date(r.maintenanceDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); });
        return {
            count: recent.length,
            severity: this.calculateIssueSeverity(recent),
            types: Array.from(new Set(recent.map(function (r) { return r.maintenanceType; })))
        };
    };
    MaintenanceAnalytics.prototype.calculateIssueSeverity = function (records) {
        var severe = records.filter(function (r) { return r.systemImpact === 'SEVERE'; }).length;
        var moderate = records.filter(function (r) { return r.systemImpact === 'MODERATE'; }).length;
        var total = records.length;
        if (severe / total > 0.2)
            return 'HIGH';
        if (moderate / total > 0.3)
            return 'MODERATE';
        return 'LOW';
    };
    MaintenanceAnalytics.prototype.calculateReliability = function (records) {
        var totalHours = records.reduce(function (sum, r) { return sum + r.downtimeHours; }, 0);
        var operationalHours = records.reduce(function (sum, r) { return sum + r.operationalHours; }, 0);
        return (operationalHours / (operationalHours + totalHours)) * 100;
    };
    MaintenanceAnalytics.prototype.calculateAlerts = function (system, records) {
        var alerts = [];
        if (system.status === 'MAINTENANCE') {
            alerts.push('System requires maintenance');
        }
        if (system.performanceMetrics.efficiency < 80) {
            alerts.push('Low system efficiency');
        }
        if (system.performanceMetrics.systemAvailability < 95) {
            alerts.push('Low system availability');
        }
        var upcoming = records.filter(function (r) { return new Date(r.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); });
        if (upcoming.length > 0) {
            alerts.push("Upcoming maintenance: ".concat(upcoming.length, " tasks"));
        }
        return alerts;
    };
    MaintenanceAnalytics.prototype.calculateMaintenanceSchedule = function (system) {
        return {
            nextMaintenance: system.nextMaintenanceDate,
            frequency: system.maintenanceFrequency,
            lastMaintenance: system.lastMaintenanceDate,
            overdue: new Date(system.nextMaintenanceDate) < new Date(),
            upcoming: new Date(system.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
    };
    MaintenanceAnalytics.prototype.calculateDailyGeneration = function (system) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for daily generation calculation
                return [2 /*return*/, 0];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateMonthlyGeneration = function (system) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for monthly generation calculation
                return [2 /*return*/, 0];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateYearlyGeneration = function (system) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for yearly generation calculation
                return [2 /*return*/, 0];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateSystemEfficiency = function (system) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for efficiency calculation
                return [2 /*return*/, 0];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateMaintenanceCosts = function (records) {
        return __awaiter(this, void 0, void 0, function () {
            var total, averagePerKw, trend;
            return __generator(this, function (_a) {
                total = records.reduce(function (sum, r) { return sum + r.maintenanceCost; }, 0);
                averagePerKw = total / records.length;
                trend = this.calculateCostTrend(records);
                return [2 /*return*/, {
                        total: total,
                        averagePerKw: averagePerKw,
                        trend: trend
                    }];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateOperationalHours = function (records) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, records.reduce(function (sum, r) { return sum + r.operationalHours; }, 0)];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateDowntime = function (records) {
        return __awaiter(this, void 0, void 0, function () {
            var totalHours, percentage, frequency;
            return __generator(this, function (_a) {
                totalHours = records.reduce(function (sum, r) { return sum + r.downtimeHours; }, 0);
                percentage = (totalHours / (8760 * records.length)) * 100;
                frequency = records.filter(function (r) { return r.downtimeHours > 0; }).length;
                return [2 /*return*/, {
                        totalHours: totalHours,
                        percentage: percentage,
                        frequency: frequency
                    }];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateEnergyLoss = function (system, records) {
        return __awaiter(this, void 0, void 0, function () {
            var totalKwh, percentage, causes;
            return __generator(this, function (_a) {
                totalKwh = records.reduce(function (sum, r) { return sum + r.energyLoss; }, 0);
                percentage = (totalKwh / (system.capacityKw * 8760)) * 100;
                causes = Array.from(new Set(records.map(function (r) { return r.maintenanceDescription; })));
                return [2 /*return*/, {
                        totalKwh: totalKwh,
                        percentage: percentage,
                        causes: causes
                    }];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateSystemAvailability = function (records) {
        return __awaiter(this, void 0, void 0, function () {
            var totalHours, downtime;
            return __generator(this, function (_a) {
                totalHours = records.reduce(function (sum, r) { return sum + r.operationalHours; }, 0);
                downtime = records.reduce(function (sum, r) { return sum + r.downtimeHours; }, 0);
                return [2 /*return*/, (totalHours / (totalHours + downtime)) * 100];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculatePerformanceRatio = function (system) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for performance ratio calculation
                return [2 /*return*/, 0];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateCapacityFactor = function (system) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for capacity factor calculation
                return [2 /*return*/, 0];
            });
        });
    };
    MaintenanceAnalytics.prototype.calculateCostTrend = function (records) {
        if (records.length < 2)
            return 'STABLE';
        var sorted = __spreadArray([], records, true).sort(function (a, b) {
            return new Date(a.maintenanceDate).getTime() - new Date(b.maintenanceDate).getTime();
        });
        var first = sorted[0].maintenanceCost;
        var last = sorted[sorted.length - 1].maintenanceCost;
        if (last > first * 1.2)
            return 'INCREASE';
        if (last < first * 0.8)
            return 'DECREASE';
        return 'STABLE';
    };
    return MaintenanceAnalytics;
}());
exports.MaintenanceAnalytics = MaintenanceAnalytics;
exports.maintenanceAnalytics = MaintenanceAnalytics.getInstance();
