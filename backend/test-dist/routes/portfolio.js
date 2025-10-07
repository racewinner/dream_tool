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
var express_1 = __importDefault(require("express"));
var techno_economic_1 = require("../utils/techno-economic");
var auth_1 = require("../middleware/auth");
var router = express_1.default.Router();
// Get portfolio data for all sites
router.get('/', auth_1.authMiddleware, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sites, portfolio, _i, sites_1, site, assessment, results;
    return __generator(this, function (_a) {
        try {
            userId = req.user.userId;
            sites = [
                {
                    id: 'site1',
                    name: 'Site 1',
                    location: {
                        latitude: 37.7749,
                        longitude: -122.4194,
                        address: 'San Francisco, CA'
                    },
                    energyData: {
                        dailyUsage: 5000,
                        peakHours: 8,
                        equipment: [
                            { name: 'Production Line 1', power: 1000, hours: 8, efficiency: 0.9, critical: true },
                            { name: 'Production Line 2', power: 800, hours: 8, efficiency: 0.85, critical: true },
                            { name: 'Lighting', power: 200, hours: 16, efficiency: 0.95, critical: false }
                        ],
                        solarPanelEfficiency: 0.18,
                        batteryEfficiency: 0.9,
                        gridAvailability: 0.95
                    }
                },
                {
                    id: 'site2',
                    name: 'Site 2',
                    location: {
                        latitude: 34.0522,
                        longitude: -118.2437,
                        address: 'Los Angeles, CA'
                    },
                    energyData: {
                        dailyUsage: 7000,
                        peakHours: 10,
                        equipment: [
                            { name: 'Production Line 1', power: 1500, hours: 10, efficiency: 0.9, critical: true },
                            { name: 'Production Line 2', power: 1200, hours: 10, efficiency: 0.85, critical: true },
                            { name: 'Lighting', power: 300, hours: 16, efficiency: 0.95, critical: false },
                            { name: 'HVAC', power: 500, hours: 24, efficiency: 0.8, critical: true }
                        ],
                        solarPanelEfficiency: 0.18,
                        batteryEfficiency: 0.9,
                        gridAvailability: 0.9
                    }
                }
            ];
            portfolio = {
                sites: sites,
                portfolioAnalysis: {
                    totalEnergyProduction: 0,
                    totalDieselConsumption: 0,
                    totalCO2Reduction: 0,
                    totalCO2Emissions: 0,
                    totalWaterSaved: 0,
                    totalLandRequired: 0,
                    totalMaintenanceWaste: 0,
                    averageSystemEfficiency: 0,
                    portfolioNPV: 0,
                    portfolioIRR: 0,
                    costSavings: 0,
                    paybackPeriod: 0
                }
            };
            // Calculate analysis for each site
            for (_i = 0, sites_1 = sites; _i < sites_1.length; _i++) {
                site = sites_1[_i];
                assessment = new techno_economic_1.TechnoEconomicAssessment(site.energyData);
                results = assessment.calculate();
                // Update portfolio metrics
                portfolio.portfolioAnalysis.totalEnergyProduction += results.pv.energyProduction.yearly;
                portfolio.portfolioAnalysis.totalDieselConsumption += results.diesel.fuelConsumption.yearly;
                portfolio.portfolioAnalysis.totalCO2Reduction += results.pv.environmentalImpact.co2Reduction;
                portfolio.portfolioAnalysis.totalCO2Emissions += results.diesel.environmentalImpact.co2Emissions;
                portfolio.portfolioAnalysis.totalWaterSaved += results.pv.environmentalImpact.waterSaved;
                portfolio.portfolioAnalysis.totalLandRequired += results.pv.environmentalImpact.landRequired;
                portfolio.portfolioAnalysis.totalMaintenanceWaste += results.diesel.environmentalImpact.maintenanceWaste;
                // Add site analysis results
                site.analysis = {
                    pv: results.pv,
                    diesel: results.diesel
                };
            }
            // Calculate portfolio-wide metrics
            portfolio.portfolioAnalysis.averageSystemEfficiency = portfolio.sites.reduce(function (sum, site) { return sum + (site.analysis.pv.energyProduction.yearly /
                (site.analysis.pv.energyProduction.yearly + site.analysis.diesel.fuelConsumption.yearly)); }, 0) / portfolio.sites.length;
            portfolio.portfolioAnalysis.costSavings = portfolio.portfolioAnalysis.totalDieselConsumption * 1.5 -
                portfolio.portfolioAnalysis.totalEnergyProduction * 0.1;
            portfolio.portfolioAnalysis.paybackPeriod = portfolio.sites.reduce(function (sum, site) { return sum + site.analysis.pv.financial.initialCost + site.analysis.diesel.financial.initialCost; }, 0) / (portfolio.portfolioAnalysis.totalEnergyProduction * 0.1);
            res.json(portfolio);
        }
        catch (error) {
            console.error('Error fetching portfolio data:', error);
            res.status(500).json({ error: 'Failed to fetch portfolio data' });
        }
        return [2 /*return*/];
    });
}); });
// Add new site to portfolio
router.post('/', auth_1.authMiddleware, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, siteData;
    return __generator(this, function (_a) {
        try {
            userId = req.user.userId;
            siteData = req.body.siteData;
            // TODO: Validate site data
            // TODO: Save to database
            res.status(201).json({ message: 'Site added successfully' });
        }
        catch (error) {
            console.error('Error adding site:', error);
            res.status(500).json({ error: 'Failed to add site' });
        }
        return [2 /*return*/];
    });
}); });
// Update site data
router.put('/:siteId', auth_1.authMiddleware, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, siteId, siteData;
    return __generator(this, function (_a) {
        try {
            userId = req.user.userId;
            siteId = req.params.siteId;
            siteData = req.body.siteData;
            // TODO: Validate site data
            // TODO: Update in database
            res.json({ message: 'Site updated successfully' });
        }
        catch (error) {
            console.error('Error updating site:', error);
            res.status(500).json({ error: 'Failed to update site' });
        }
        return [2 /*return*/];
    });
}); });
// Delete site from portfolio
router.delete('/:siteId', auth_1.authMiddleware, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, siteId;
    return __generator(this, function (_a) {
        try {
            userId = req.user.userId;
            siteId = req.params.siteId;
            // TODO: Delete from database
            res.json({ message: 'Site removed successfully' });
        }
        catch (error) {
            console.error('Error removing site:', error);
            res.status(500).json({ error: 'Failed to remove site' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
