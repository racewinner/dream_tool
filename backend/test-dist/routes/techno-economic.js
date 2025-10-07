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
var express_1 = require("express");
var facility_1 = require("../models/facility");
var technoEconomicAnalysis_1 = require("../models/technoEconomicAnalysis");
var survey_1 = require("../models/survey");
var auth_1 = require("../middleware/auth");
var batteryCosts = {
    lithium: 300, // $/kWh
    lead_acid: 150 // $/kWh
};
;
var calculatePVInitialCost = function (dailyUsage, peakHours, batteryAutonomyFactor, batteryDepthOfDischarge, batteryType, inverterEfficiency, params) {
    // Calculate PV system size (kW)
    var pvSystemSize = dailyUsage / (peakHours * 0.85 * inverterEfficiency);
    // Calculate battery capacity (kWh)
    var batteryCapacity = dailyUsage * batteryAutonomyFactor / batteryDepthOfDischarge;
    // Default costs
    var defaultCosts = {
        panelCostPerWatt: 0.4, // $/Watt
        panelCostPerKw: 400, // $/kW
        batteryCostPerKwh: batteryType === 'lithium' ? 300 : 150, // $/kWh
        inverterCostPerKw: 300, // $/kW
        structureCostPerKw: 150, // $/kW
        fixedCosts: 0,
        numPanels: 0,
        panelRating: 0
    };
    // Set costs based on costing method
    var costs = __assign({}, defaultCosts);
    if (params.costingMethod === 'perWatt') {
        costs = __assign(__assign({}, costs), { panelCostPerWatt: params.panelCostPerWatt || costs.panelCostPerWatt, panelCostPerKw: params.panelCostPerKw || costs.panelCostPerKw, batteryCostPerKwh: params.batteryCostPerKwh || costs.batteryCostPerKwh, inverterCostPerKw: params.inverterCostPerKw || costs.inverterCostPerKw, structureCostPerKw: params.structureCostPerKw || costs.structureCostPerKw, fixedCosts: params.fixedCosts || costs.fixedCosts });
    }
    else if (params.costingMethod === 'fixedVariable') {
        costs = __assign(__assign({}, costs), { panelCostPerKw: params.panelCostPerKw || costs.panelCostPerKw, batteryCostPerKwh: params.batteryCostPerKwh || costs.batteryCostPerKwh, inverterCostPerKw: params.inverterCostPerKw || costs.inverterCostPerKw, structureCostPerKw: params.structureCostPerKw || costs.structureCostPerKw, fixedCosts: params.fixedCosts || costs.fixedCosts });
    }
    else if (params.costingMethod === 'componentBased') {
        costs = __assign(__assign({}, costs), { numPanels: params.numPanels || Math.ceil(pvSystemSize * 1000 / (params.panelRating || 400)), panelRating: params.panelRating || 400, panelCostPerKw: params.panelCostPerKw || costs.panelCostPerKw, batteryCostPerKwh: params.batteryCostPerKwh || costs.batteryCostPerKwh, inverterCostPerKw: params.inverterCostPerKw || costs.inverterCostPerKw, structureCostPerKw: params.structureCostPerKw || costs.structureCostPerKw, fixedCosts: params.fixedCosts || costs.fixedCosts });
    }
    // Calculate costs based on method
    var pvCost = 0;
    if (params.costingMethod === 'perWatt') {
        pvCost = pvSystemSize * 1000 * costs.panelCostPerWatt;
    }
    else if (params.costingMethod === 'fixedVariable') {
        pvCost = pvSystemSize * (costs.panelCostPerKw + costs.inverterCostPerKw + costs.structureCostPerKw) + costs.fixedCosts;
    }
    else if (params.costingMethod === 'componentBased') {
        pvCost = costs.numPanels * (costs.panelRating * costs.panelCostPerKw / 1000) +
            pvSystemSize * (costs.inverterCostPerKw + costs.structureCostPerKw) + costs.fixedCosts;
    }
    var batteryCost = batteryCapacity * costs.batteryCostPerKwh;
    return __assign({ pvCost: pvCost, batteryCost: batteryCost, pvSystemSize: pvSystemSize, batteryCapacity: batteryCapacity }, costs);
};
var router = (0, express_1.Router)();
// Calculate techno-economic analysis
router.post('/:facilityId', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facilityId, facility, _a, stage, costingMethod, _b, batteryAutonomyFactor, _c, batteryDepthOfDischarge, _d, batteryType, _e, inverterEfficiency, costingParams, survey, calculateDailyUsage, facilityData, dailyUsage, peakHours, _f, pvCost, batteryCost, pvSystemSize, batteryCapacity, panelCostPerWatt, panelCostPerKw, batteryCostPerKwh, inverterCostPerKw, structureCostPerKw, fixedCosts, numPanels, panelRating, dieselFuelCost, dieselEfficiency, dieselMaintenance, dieselInitialCost, dieselAnnualMaintenance, pvAnnualMaintenance, pvLifecycleCost, dieselLifecycleCost, discountRate, pvNpv, dieselNpv, pvIrr, dieselIrr, analysis, error_1;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _g.trys.push([0, 4, , 5]);
                facilityId = req.params.facilityId;
                return [4 /*yield*/, facility_1.Facility.findByPk(facilityId)];
            case 1:
                facility = _g.sent();
                if (!facility) {
                    return [2 /*return*/, res.status(404).json({ error: 'Facility not found' })];
                }
                _a = req.body, stage = _a.stage, costingMethod = _a.costingMethod, _b = _a.batteryAutonomyFactor, batteryAutonomyFactor = _b === void 0 ? 1.0 : _b, _c = _a.batteryDepthOfDischarge, batteryDepthOfDischarge = _c === void 0 ? 0.8 : _c, _d = _a.batteryType, batteryType = _d === void 0 ? 'lithium' : _d, _e = _a.inverterEfficiency, inverterEfficiency = _e === void 0 ? 0.94 : _e;
                costingParams = __assign({ panelCostPerWatt: 0.4, panelCostPerKw: 400, batteryCostPerKwh: 300, inverterCostPerKw: 300, structureCostPerKw: 150, fixedCosts: 0, numPanels: 0, panelRating: 400 }, req.body);
                return [4 /*yield*/, survey_1.Survey.findOne({
                        where: { facilityId: facilityId },
                        order: [['createdAt', 'DESC']], // Get the latest survey
                    })];
            case 2:
                survey = _g.sent();
                if (!survey) {
                    return [2 /*return*/, res.status(404).json({ error: 'No survey data found for this facility' })];
                }
                calculateDailyUsage = function (facilityData) {
                    var equipment = facilityData.equipment, operationalHours = facilityData.operationalHours, infrastructure = facilityData.infrastructure;
                    // Base calculation for equipment usage
                    var equipmentUsage = equipment.reduce(function (total, item) {
                        var powerRating = item.powerRating, quantity = item.quantity, hoursPerDay = item.hoursPerDay, hoursPerNight = item.hoursPerNight, weeklyUsage = item.weeklyUsage, timeOfDay = item.timeOfDay;
                        // Calculate availability factor
                        var weeklyDays = 7;
                        var availabilityFactor = weeklyUsage / weeklyDays;
                        // Calculate daily energy usage for this equipment
                        var dailyEnergy = ((hoursPerDay + hoursPerNight) *
                            powerRating *
                            quantity *
                            availabilityFactor) / 1000; // Convert to kWh
                        // Adjust for time of day
                        var timeOfDayFactor = 1.0;
                        if (timeOfDay === 'morning' || timeOfDay === 'afternoon') {
                            timeOfDayFactor = 1.0; // Regular hours
                        }
                        else if (timeOfDay === 'evening') {
                            timeOfDayFactor = 1.2; // Peak hours
                        }
                        else if (timeOfDay === 'night') {
                            timeOfDayFactor = 0.8; // Off-peak hours
                        }
                        return total + (dailyEnergy * timeOfDayFactor);
                    }, 0);
                    // Adjust for operational hours
                    var totalOperationalHours = operationalHours.day + operationalHours.night;
                    var operationalFactor = totalOperationalHours / 24;
                    // Consider infrastructure factors
                    var infrastructureFactor = 1.0;
                    if (infrastructure.nationalGrid) {
                        infrastructureFactor *= 0.9; // 10% reduction if connected to national grid
                    }
                    if (infrastructure.digitalConnectivity === 'high') {
                        infrastructureFactor *= 1.1; // 10% increase for high connectivity
                    }
                    return equipmentUsage * operationalFactor * infrastructureFactor;
                };
                facilityData = survey.facilityData;
                dailyUsage = calculateDailyUsage(facilityData);
                peakHours = Math.max(facilityData.operationalHours.day, facilityData.operationalHours.night) * 0.85;
                // Validate inputs
                if (!dailyUsage || !peakHours) {
                    return [2 /*return*/, res.status(400).json({ error: 'Daily usage and peak hours are required' })];
                }
                // Validate stage and costing method combination
                if (stage === 'prefeasibility' && costingMethod === 'componentBased') {
                    return [2 /*return*/, res.status(400).json({ error: 'Component-based costing is only available for tendering stage' })];
                }
                if (stage === 'tendering' && costingMethod !== 'componentBased') {
                    return [2 /*return*/, res.status(400).json({ error: 'Only component-based costing is available for tendering stage' })];
                }
                _f = calculatePVInitialCost(dailyUsage, peakHours, batteryAutonomyFactor, batteryDepthOfDischarge, batteryType, inverterEfficiency, costingParams), pvCost = _f.pvCost, batteryCost = _f.batteryCost, pvSystemSize = _f.pvSystemSize, batteryCapacity = _f.batteryCapacity, panelCostPerWatt = _f.panelCostPerWatt, panelCostPerKw = _f.panelCostPerKw, batteryCostPerKwh = _f.batteryCostPerKwh, inverterCostPerKw = _f.inverterCostPerKw, structureCostPerKw = _f.structureCostPerKw, fixedCosts = _f.fixedCosts, numPanels = _f.numPanels, panelRating = _f.panelRating;
                dieselFuelCost = 1.5;
                dieselEfficiency = 0.3;
                dieselMaintenance = 0.05;
                dieselInitialCost = dailyUsage / dieselEfficiency * dieselFuelCost;
                dieselAnnualMaintenance = dailyUsage / dieselEfficiency * dieselFuelCost * dieselMaintenance;
                pvAnnualMaintenance = pvCost * 0.02;
                pvLifecycleCost = pvCost + pvAnnualMaintenance * 10 + batteryCost;
                dieselLifecycleCost = dieselInitialCost * 365 * 10 + dieselAnnualMaintenance * 365 * 10;
                discountRate = 0.08;
                pvNpv = pvCost + pvAnnualMaintenance * (1 - Math.pow(1 + discountRate, -10)) / discountRate + batteryCost;
                dieselNpv = dieselLifecycleCost / (1 + discountRate);
                pvIrr = 0.12;
                dieselIrr = 0.05;
                return [4 /*yield*/, technoEconomicAnalysis_1.TechnoEconomicAnalysis.create({
                        facilityId: facility.id,
                        dailyUsage: dailyUsage,
                        peakHours: peakHours,
                        batteryAutonomyFactor: batteryAutonomyFactor,
                        batteryDepthOfDischarge: batteryDepthOfDischarge,
                        batteryType: batteryType,
                        inverterEfficiency: inverterEfficiency,
                        costingMethod: costingMethod,
                        panelCostPerWatt: panelCostPerWatt,
                        panelCostPerKw: panelCostPerKw,
                        batteryCostPerKwh: batteryCostPerKwh,
                        inverterCostPerKw: inverterCostPerKw,
                        structureCostPerKw: structureCostPerKw,
                        fixedCosts: fixedCosts,
                        numPanels: numPanels,
                        panelRating: panelRating,
                        pvInitialCost: pvCost,
                        pvAnnualMaintenance: pvAnnualMaintenance,
                        pvLifecycleCost: pvLifecycleCost,
                        pvNpv: pvNpv,
                        pvIrr: pvIrr,
                        dieselInitialCost: dieselInitialCost,
                        dieselAnnualMaintenance: dieselAnnualMaintenance,
                        dieselLifecycleCost: dieselLifecycleCost,
                        dieselNpv: dieselNpv,
                        dieselIrr: dieselIrr
                    })];
            case 3:
                analysis = _g.sent();
                res.json({
                    pv: {
                        initialCost: pvCost,
                        annualMaintenance: pvAnnualMaintenance,
                        lifecycleCost: pvLifecycleCost,
                        npv: pvNpv,
                        irr: pvIrr,
                        systemSize: pvSystemSize,
                        batteryCapacity: batteryCapacity,
                        costingMethod: costingMethod,
                        panelCostPerWatt: panelCostPerWatt,
                        panelCostPerKw: panelCostPerKw,
                        batteryCostPerKwh: batteryCostPerKwh,
                        inverterCostPerKw: inverterCostPerKw,
                        structureCostPerKw: structureCostPerKw,
                        fixedCosts: fixedCosts,
                        numPanels: numPanels,
                        panelRating: panelRating
                    },
                    diesel: {
                        initialCost: dieselInitialCost,
                        annualMaintenance: dieselAnnualMaintenance,
                        lifecycleCost: dieselLifecycleCost,
                        npv: dieselNpv,
                        irr: dieselIrr
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _g.sent();
                res.status(400).json({ error: 'Error calculating techno-economic analysis' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Helper functions for calculations
function calculateDieselInitialCost(dailyUsage) {
    // Simple cost calculation for diesel generator
    var generatorCost = 1000; // $/kW
    var installationCost = 3000; // Fixed cost
    var systemSize = dailyUsage / 24; // kW
    return (systemSize * generatorCost) + installationCost;
}
function calculatePVAnnualMaintenance(initialCost) {
    // 2% of initial cost for maintenance
    return initialCost * 0.02;
}
function calculateDieselAnnualMaintenance(initialCost) {
    // 5% of initial cost for maintenance
    return initialCost * 0.05;
}
function calculateLifecycleCost(initialCost, annualMaintenance) {
    // 20-year lifecycle
    var years = 20;
    return initialCost + (annualMaintenance * years);
}
function calculateNPV(initialCost, annualMaintenance, lifecycleCost) {
    // Simple NPV calculation (this would be more complex in production)
    var discountRate = 0.1; // 10% discount rate
    var years = 20;
    var npv = -initialCost;
    for (var i = 1; i <= years; i++) {
        npv += (annualMaintenance / Math.pow(1 + discountRate, i));
    }
    return npv;
}
function calculateIRR(initialCost, annualMaintenance, lifecycleCost) {
    // Simple IRR calculation (this would be more complex in production)
    var years = 20;
    var totalSavings = lifecycleCost - initialCost;
    return (totalSavings / initialCost / years) * 100;
}
exports.default = router;
