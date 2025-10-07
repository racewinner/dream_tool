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
exports.SolarAnalysisService = void 0;
var weatherService_1 = require("./weatherService");
var SolarAnalysisService = /** @class */ (function () {
    function SolarAnalysisService() {
        this.weatherService = weatherService_1.WeatherService.getInstance();
    }
    SolarAnalysisService.getInstance = function () {
        if (!SolarAnalysisService.instance) {
            SolarAnalysisService.instance = new SolarAnalysisService();
        }
        return SolarAnalysisService.instance;
    };
    SolarAnalysisService.prototype.analyzeSolarPotential = function (facilityId_1, latitude_1, longitude_1, panelRating_1, numPanels_1) {
        return __awaiter(this, arguments, void 0, function (facilityId, latitude, longitude, panelRating, numPanels, systemLosses) {
            var endDate, startDate, weatherData, dailyProduction_1, monthlyProduction_1, yearlyProduction, optimalTiltAngle, optimalOrientation, averageTemperature, temperatureImpact, shadingImpact, systemEfficiency, error_1;
            var _this = this;
            if (systemLosses === void 0) { systemLosses = 15; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        endDate = new Date();
                        startDate = new Date();
                        startDate.setFullYear(startDate.getFullYear() - 1);
                        return [4 /*yield*/, this.weatherService.getHistoricalWeather(latitude, longitude, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])];
                    case 1:
                        weatherData = _a.sent();
                        dailyProduction_1 = weatherData.map(function (day) {
                            var _a = day.current, temperature = _a.temperature, solarRadiation = _a.solarRadiation, humidity = _a.humidity;
                            return _this.calculateDailyProduction(solarRadiation, temperature, panelRating, numPanels, systemLosses);
                        });
                        monthlyProduction_1 = Array(12).fill(0);
                        weatherData.forEach(function (day, index) {
                            var month = new Date(day.date).getMonth();
                            monthlyProduction_1[month] += dailyProduction_1[index];
                        });
                        yearlyProduction = dailyProduction_1.reduce(function (sum, value) { return sum + value; }, 0);
                        optimalTiltAngle = this.calculateOptimalTiltAngle(latitude);
                        optimalOrientation = this.calculateOptimalOrientation(latitude);
                        averageTemperature = weatherData.reduce(function (sum, day) { return sum + day.current.temperature; }, 0) / weatherData.length;
                        temperatureImpact = this.calculateTemperatureImpact(averageTemperature);
                        shadingImpact = this.calculateShadingImpact(latitude, longitude, optimalTiltAngle);
                        systemEfficiency = this.calculateSystemEfficiency(dailyProduction_1, panelRating, numPanels);
                        return [2 /*return*/, {
                                dailyEnergyProduction: dailyProduction_1.reduce(function (sum, value) { return sum + value; }, 0) / dailyProduction_1.length,
                                monthlyEnergyProduction: monthlyProduction_1,
                                yearlyEnergyProduction: yearlyProduction,
                                optimalTiltAngle: optimalTiltAngle,
                                optimalOrientation: optimalOrientation,
                                temperatureImpact: temperatureImpact,
                                shadingImpact: shadingImpact,
                                systemEfficiency: systemEfficiency,
                            }];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error analyzing solar potential:', error_1);
                        throw new Error('Failed to analyze solar potential');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SolarAnalysisService.prototype.calculateDailyProduction = function (solarRadiation, temperature, panelRating, numPanels, systemLosses) {
        // Calculate temperature coefficient impact
        var tempCoefficient = -0.45; // % per degree Celsius
        var tempImpact = 1 + (temperature - 25) * (tempCoefficient / 100);
        // Calculate system losses
        var systemEfficiency = 1 - (systemLosses / 100);
        // Calculate daily production
        return ((solarRadiation * 0.001) * // Convert to kWh/m²
            panelRating * // Panel rating in W
            numPanels * // Number of panels
            tempImpact * // Temperature impact
            systemEfficiency // System losses
        );
    };
    SolarAnalysisService.prototype.calculateOptimalTiltAngle = function (latitude) {
        // Optimal tilt angle is approximately equal to latitude
        // Adjust slightly for better performance
        return latitude + 5;
    };
    SolarAnalysisService.prototype.calculateOptimalOrientation = function (latitude) {
        return latitude > 0 ? 'South' : 'North';
    };
    SolarAnalysisService.prototype.calculateTemperatureImpact = function (averageTemperature) {
        // Calculate temperature impact on PV efficiency
        var baseTemp = 25; // Standard test conditions
        var tempCoefficient = -0.45; // % per degree Celsius
        return tempCoefficient * (averageTemperature - baseTemp);
    };
    SolarAnalysisService.prototype.calculateShadingImpact = function (latitude, longitude, tiltAngle) {
        // Simplified shading calculation based on location and tilt
        // This is a placeholder - actual implementation would require more detailed analysis
        var shadingFactor = 0.9; // 10% reduction due to potential shading
        return shadingFactor;
    };
    SolarAnalysisService.prototype.calculateSystemEfficiency = function (dailyProduction, panelRating, numPanels) {
        // Calculate system efficiency based on actual vs theoretical production
        var theoreticalProduction = dailyProduction.length *
            panelRating *
            numPanels *
            0.001; // Convert to kWh
        var actualProduction = dailyProduction.reduce(function (sum, value) { return sum + value; }, 0);
        return (actualProduction / theoreticalProduction) * 100;
    };
    return SolarAnalysisService;
}());
exports.SolarAnalysisService = SolarAnalysisService;
