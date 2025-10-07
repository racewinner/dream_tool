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
exports.WeatherService = void 0;
var weatherProvider_1 = require("./providers/weatherProvider");
var cacheService_1 = require("./cacheService");
var weatherValidator_1 = require("./weatherValidator");
var WeatherService = /** @class */ (function () {
    function WeatherService() {
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 second
        this.providers = [
            new weatherProvider_1.OpenWeatherProvider(),
            new weatherProvider_1.NRELProvider(),
            new weatherProvider_1.NASAPOWERProvider(),
        ];
        this.cache = cacheService_1.CacheService.getInstance();
        this.validator = weatherValidator_1.WeatherValidator.getInstance();
    }
    WeatherService.getInstance = function () {
        if (!WeatherService.instance) {
            WeatherService.instance = new WeatherService();
        }
        return WeatherService.instance;
    };
    WeatherService.prototype.getCurrentWeather = function (latitude_1, longitude_1) {
        return __awaiter(this, arguments, void 0, function (latitude, longitude, retryCount) {
            var cacheKey, cachedData, lastError, lastValidData, _i, _a, provider, data, error_1, err;
            var _this = this;
            if (retryCount === void 0) { retryCount = 0; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validate coordinates
                        if (!this.validator.validateCoordinates(latitude, longitude)) {
                            throw new Error('Invalid coordinates');
                        }
                        cacheKey = this.cache.generateCacheKey('weather', latitude, longitude);
                        return [4 /*yield*/, this.cache.get(cacheKey)];
                    case 1:
                        cachedData = _b.sent();
                        if (cachedData) {
                            return [2 /*return*/, cachedData];
                        }
                        lastError = null;
                        lastValidData = null;
                        _i = 0, _a = this.providers;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        provider = _a[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, provider.getCurrentWeather(latitude, longitude)];
                    case 4:
                        data = _b.sent();
                        if (!this.validator.validateWeatherData(data)) return [3 /*break*/, 6];
                        lastValidData = data;
                        // Cache valid data
                        return [4 /*yield*/, this.cache.set(cacheKey, data)];
                    case 5:
                        // Cache valid data
                        _b.sent();
                        return [2 /*return*/, data];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _b.sent();
                        err = error_1;
                        err.provider = provider.constructor.name;
                        console.error("Error with ".concat(provider.constructor.name, ":"), error_1);
                        lastError = err;
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 2];
                    case 9:
                        // If we have valid data from a previous provider, return it
                        if (lastValidData) {
                            return [2 /*return*/, lastValidData];
                        }
                        if (!(lastError && retryCount < this.MAX_RETRIES)) return [3 /*break*/, 14];
                        if (!lastError.retryAfter) return [3 /*break*/, 11];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, lastError.retryAfter); })];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 11: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.RETRY_DELAY); })];
                    case 12:
                        _b.sent();
                        _b.label = 13;
                    case 13: return [2 /*return*/, this.getCurrentWeather(latitude, longitude, retryCount + 1)];
                    case 14:
                        // If we've exhausted all providers and retries
                        if (lastError) {
                            throw lastError;
                        }
                        throw new Error('Failed to fetch weather data from all providers');
                }
            });
        });
    };
    WeatherService.prototype.getHistoricalWeather = function (latitude_1, longitude_1, startDate_1, endDate_1) {
        return __awaiter(this, arguments, void 0, function (latitude, longitude, startDate, endDate, retryCount) {
            var cacheKey, cachedData, results, lastError, lastValidData, _i, _a, provider, data, error_2, err;
            var _this = this;
            if (retryCount === void 0) { retryCount = 0; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validate coordinates and date range
                        if (!this.validator.validateCoordinates(latitude, longitude)) {
                            throw new Error('Invalid coordinates');
                        }
                        if (!this.validator.validateDateRange(startDate, endDate)) {
                            throw new Error('Invalid date range');
                        }
                        cacheKey = this.cache.generateCacheKey('historical', latitude, longitude, startDate);
                        return [4 /*yield*/, this.cache.get(cacheKey)];
                    case 1:
                        cachedData = _b.sent();
                        if (cachedData) {
                            return [2 /*return*/, cachedData];
                        }
                        results = [];
                        lastError = null;
                        lastValidData = null;
                        _i = 0, _a = this.providers;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        provider = _a[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, provider.getHistoricalWeather(latitude, longitude, startDate, endDate)];
                    case 4:
                        data = _b.sent();
                        if (!(data && data.length > 0 && data.every(this.validator.validateWeatherData))) return [3 /*break*/, 6];
                        lastValidData = data;
                        // Cache valid data
                        return [4 /*yield*/, this.cache.set(cacheKey, data)];
                    case 5:
                        // Cache valid data
                        _b.sent();
                        return [2 /*return*/, data];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_2 = _b.sent();
                        err = error_2;
                        err.provider = provider.constructor.name;
                        console.error("Error with ".concat(provider.constructor.name, ":"), error_2);
                        lastError = err;
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 2];
                    case 9:
                        // If we have valid data from a previous provider, return it
                        if (lastValidData) {
                            return [2 /*return*/, lastValidData];
                        }
                        if (!(lastError && retryCount < this.MAX_RETRIES)) return [3 /*break*/, 14];
                        if (!lastError.retryAfter) return [3 /*break*/, 11];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, lastError.retryAfter); })];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 11: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.RETRY_DELAY); })];
                    case 12:
                        _b.sent();
                        _b.label = 13;
                    case 13: return [2 /*return*/, this.getHistoricalWeather(latitude, longitude, startDate, endDate, retryCount + 1)];
                    case 14:
                        // If we've exhausted all providers and retries
                        if (lastError) {
                            throw lastError;
                        }
                        throw new Error('Failed to fetch historical weather data from all providers');
                }
            });
        });
    };
    WeatherService.prototype.mergeWeatherData = function (data) {
        // Group data by date
        var groupedData = data.reduce(function (acc, item) {
            item.daily.forEach(function (day) {
                var date = day.date;
                if (!acc[date]) {
                    acc[date] = {
                        latitude: item.latitude,
                        longitude: item.longitude,
                        timezone: item.timezone,
                        current: item.current,
                        daily: [],
                    };
                }
                acc[date].daily.push(day);
            });
            return acc;
        }, {});
        // Calculate averages for each date
        return Object.values(groupedData).map(function (item) { return (__assign(__assign({}, item), { daily: item.daily.map(function (day) { return (__assign(__assign({}, day), { temperature: {
                    min: day.temperature.min,
                    max: day.temperature.max,
                }, solarRadiation: day.solarRadiation, precipitation: day.precipitation, humidity: day.humidity })); }) })); });
    };
    // Additional utility methods
    WeatherService.prototype.clearCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cache.clearCache()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeatherService.prototype.deleteCacheEntry = function (latitude, longitude, type, date) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = this.cache.generateCacheKey(type, latitude, longitude, date);
                        return [4 /*yield*/, this.cache.delete(cacheKey)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return WeatherService;
}());
exports.WeatherService = WeatherService;
