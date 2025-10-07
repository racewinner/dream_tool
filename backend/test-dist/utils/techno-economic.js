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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnoEconomicAssessment = void 0;
var TechnoEconomicAssessment = /** @class */ (function () {
    function TechnoEconomicAssessment(energyData) {
        this.energyData = energyData;
        this.pvPanelCostPerWatt = 0.30; // $/W
        this.batteryCostPerWh = 0.20; // $/Wh
        this.inverterCostPerWatt = 0.15; // $/W
        this.dieselGeneratorCostPerKw = 500; // $/kW
        this.dieselFuelCostPerL = 1.50; // $/L
        this.dieselConsumptionPerKwh = 0.3; // L/kWh
        this.discountRate = 0.12; // 12% annual discount rate
        this.projectLifetime = 20; // years
        this.solarHoursPerDay = 4; // Average peak sun hours
        this.seasonalFactors = {
            winter: 0.8,
            spring: 1.0,
            summer: 1.2,
            fall: 1.1,
        };
    }
    TechnoEconomicAssessment.prototype.calculateRadiationFactor = function (season) {
        return this.seasonalFactors[season];
    };
    TechnoEconomicAssessment.prototype.calculatePVSystemSize = function () {
        // Calculate PV system size based on daily usage, peak hours, and equipment efficiency
        var totalPower = this.energyData.equipment.reduce(function (sum, eq) {
            return sum + (eq.power * eq.hours * eq.efficiency);
        }, 0);
        var dailyPeakPower = totalPower / this.energyData.peakHours;
        var systemSize = dailyPeakPower / (this.energyData.solarPanelEfficiency * 0.85); // 85% system efficiency
        return Math.ceil(systemSize * 1.2); // Add 20% safety margin
    };
    TechnoEconomicAssessment.prototype.calculateBatteryCapacity = function () {
        // Calculate battery capacity for 24-hour backup with efficiency considerations
        var totalDailyEnergy = this.energyData.equipment.reduce(function (sum, eq) {
            return sum + (eq.power * eq.hours * eq.efficiency);
        }, 0);
        return (totalDailyEnergy / this.energyData.batteryEfficiency) * 1.1; // Add 10% safety margin
    };
    TechnoEconomicAssessment.prototype.calculateEnergyProduction = function () {
        var _this = this;
        var systemSize = this.calculatePVSystemSize();
        var monthlyProduction = Array(12).fill(0).map(function (_, month) {
            var season = Math.floor(month / 3);
            var seasonalFactor = Object.values(_this.seasonalFactors)[season];
            return systemSize * 1000 * _this.solarHoursPerDay * 30 * seasonalFactor;
        });
        var yearlyProduction = monthlyProduction.reduce(function (sum, prod) { return sum + prod; }, 0);
        var seasonalProduction = {
            winter: monthlyProduction.slice(0, 3).reduce(function (sum, prod) { return sum + prod; }, 0),
            spring: monthlyProduction.slice(3, 6).reduce(function (sum, prod) { return sum + prod; }, 0),
            summer: monthlyProduction.slice(6, 9).reduce(function (sum, prod) { return sum + prod; }, 0),
            fall: monthlyProduction.slice(9).reduce(function (sum, prod) { return sum + prod; }, 0),
        };
        return {
            yearly: yearlyProduction,
            monthly: monthlyProduction,
            seasonal: seasonalProduction,
        };
    };
    TechnoEconomicAssessment.prototype.calculateEnvironmentalImpact = function (energyProduction) {
        return {
            co2Reduction: energyProduction * 0.5, // kg CO2 per kWh saved
            waterSaved: energyProduction * 0.001, // m3 per kWh saved
            landRequired: energyProduction * 0.0001, // m2 per kWh, assuming 10W/m2
        };
    };
    TechnoEconomicAssessment.prototype.calculatePVCosts = function () {
        var systemSize = this.calculatePVSystemSize();
        var batteryCapacity = this.calculateBatteryCapacity();
        var energyProduction = this.calculateEnergyProduction();
        var initialCost = systemSize * 1000 * this.pvPanelCostPerWatt + // PV panels
            batteryCapacity * this.batteryCostPerWh + // Batteries
            systemSize * 1000 * this.inverterCostPerWatt; // Inverter
        var annualMaintenance = initialCost * 0.02; // 2% annual maintenance
        var lifecycleCost = 0;
        for (var year = 1; year <= this.projectLifetime; year++) {
            lifecycleCost += initialCost / Math.pow(1 + this.discountRate, year);
            lifecycleCost += annualMaintenance / Math.pow(1 + this.discountRate, year);
        }
        var environmentalImpact = this.calculateEnvironmentalImpact(energyProduction.yearly);
        return {
            initialCost: initialCost,
            annualMaintenance: annualMaintenance,
            lifecycleCost: lifecycleCost,
            energyProduction: energyProduction,
            environmentalImpact: environmentalImpact,
        };
    };
    TechnoEconomicAssessment.prototype.calculateDieselCosts = function () {
        var _this = this;
        var systemSize = this.energyData.dailyUsage / 24; // kW
        var initialCost = systemSize * this.dieselGeneratorCostPerKw;
        // Calculate annual fuel consumption with seasonal variations
        var monthlyConsumption = Array(12).fill(0).map(function (_, month) {
            var season = Math.floor(month / 3);
            var seasonalFactor = Object.values(_this.seasonalFactors)[season];
            return _this.energyData.dailyUsage * 30 * seasonalFactor;
        });
        var yearlyConsumption = monthlyConsumption.reduce(function (sum, cons) { return sum + cons; }, 0);
        var monthlyFuel = monthlyConsumption.map(function (cons) {
            return cons * _this.dieselConsumptionPerKwh;
        });
        var yearlyFuel = yearlyConsumption * this.dieselConsumptionPerKwh;
        var annualFuelCost = yearlyFuel * this.dieselFuelCostPerL;
        var annualMaintenance = initialCost * 0.05; // 5% annual maintenance
        var lifecycleCost = 0;
        for (var year = 1; year <= this.projectLifetime; year++) {
            lifecycleCost += initialCost / Math.pow(1 + this.discountRate, year);
            lifecycleCost += (annualFuelCost + annualMaintenance) / Math.pow(1 + this.discountRate, year);
        }
        var environmentalImpact = {
            co2Emissions: yearlyFuel * 2.68, // kg CO2 per L diesel
            noisePollution: yearlyConsumption * 0.0001, // dB per kWh
            maintenanceWaste: yearlyConsumption * 0.00001, // kg waste per kWh
        };
        return {
            initialCost: initialCost,
            annualMaintenance: annualMaintenance,
            lifecycleCost: lifecycleCost,
            fuelConsumption: {
                yearly: yearlyFuel,
                monthly: monthlyFuel,
                seasonal: {
                    winter: monthlyFuel.slice(0, 3).reduce(function (sum, fuel) { return sum + fuel; }, 0),
                    spring: monthlyFuel.slice(3, 6).reduce(function (sum, fuel) { return sum + fuel; }, 0),
                    summer: monthlyFuel.slice(6, 9).reduce(function (sum, fuel) { return sum + fuel; }, 0),
                    fall: monthlyFuel.slice(9).reduce(function (sum, fuel) { return sum + fuel; }, 0),
                },
            },
            environmentalImpact: environmentalImpact,
        };
    };
    TechnoEconomicAssessment.prototype.analyze = function () {
        var pvData = this.calculatePVCosts();
        var dieselData = this.calculateDieselCosts();
        // Calculate cash flows for both systems
        var pvCashFlows = [-pvData.initialCost];
        var dieselCashFlows = [-dieselData.initialCost];
        for (var year = 1; year <= this.projectLifetime; year++) {
            pvCashFlows.push(-pvData.annualMaintenance);
            dieselCashFlows.push(-dieselData.annualMaintenance);
        }
        // Calculate NPV and IRR for both systems
        var pvNPV = this.calculateNPV(pvCashFlows, this.discountRate);
        var dieselNPV = this.calculateNPV(dieselCashFlows, this.discountRate);
        var pvIRR = this.newtonRaphson(pvCashFlows);
        var dieselIRR = this.newtonRaphson(dieselCashFlows);
        return {
            pv: __assign(__assign({}, pvData), { npv: pvNPV, irr: pvIRR }),
            diesel: __assign(__assign({}, dieselData), { npv: dieselNPV, irr: dieselIRR }),
        };
    };
    // Helper function for IRR calculation using Newton-Raphson method
    TechnoEconomicAssessment.prototype.newtonRaphson = function (cashFlows, maxIterations, tolerance) {
        if (maxIterations === void 0) { maxIterations = 100; }
        if (tolerance === void 0) { tolerance = 1e-6; }
        var rate = 0.1; // Initial guess
        var iteration = 0;
        var error = tolerance + 1;
        while (error > tolerance && iteration < maxIterations) {
            var npv = this.calculateNPV(cashFlows, rate);
            var npvPrime = this.calculateNPVPrime(cashFlows, rate);
            var rateNew = rate - npv / npvPrime;
            error = Math.abs(rateNew - rate);
            rate = rateNew;
            iteration++;
        }
        return rate;
    };
    TechnoEconomicAssessment.prototype.calculateNPV = function (cashFlows, rate) {
        return cashFlows.reduce(function (sum, cashFlow, t) { return sum + cashFlow / Math.pow(1 + rate, t); }, 0);
    };
    TechnoEconomicAssessment.prototype.calculateNPVPrime = function (cashFlows, rate) {
        return cashFlows.reduce(function (sum, cashFlow, t) {
            return sum - (t * cashFlow) / Math.pow(1 + rate, t + 1);
        }, 0);
    };
    return TechnoEconomicAssessment;
}());
exports.TechnoEconomicAssessment = TechnoEconomicAssessment;
exports.default = TechnoEconomicAssessment;
