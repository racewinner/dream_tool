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
exports.NASAPOWERProvider = exports.NRELProvider = exports.OpenWeatherProvider = void 0;
var axios_1 = __importDefault(require("axios"));
var config_1 = require("../../config");
var OpenWeatherProvider = /** @class */ (function () {
    function OpenWeatherProvider() {
        this.apiKey = config_1.config.weatherApiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    }
    OpenWeatherProvider.prototype.getCurrentWeather = function (latitude, longitude) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/onecall"), {
                                params: {
                                    lat: latitude,
                                    lon: longitude,
                                    exclude: 'minutely,hourly,alerts',
                                    units: 'metric',
                                    appid: this.apiKey,
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, this.transformWeatherData(response.data)];
                    case 2:
                        error_1 = _a.sent();
                        console.error('OpenWeather error:', error_1);
                        throw new Error('Failed to fetch OpenWeather data');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OpenWeatherProvider.prototype.getHistoricalWeather = function (latitude, longitude, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var dateRange, weatherData, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        dateRange = this.generateDateRange(startDate, endDate);
                        return [4 /*yield*/, Promise.all(dateRange.map(function (date) { return __awaiter(_this, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/onecall/timemachine"), {
                                                params: {
                                                    lat: latitude,
                                                    lon: longitude,
                                                    dt: Math.floor(new Date(date).getTime() / 1000),
                                                    units: 'metric',
                                                    appid: this.apiKey,
                                                },
                                            })];
                                        case 1:
                                            response = _a.sent();
                                            return [2 /*return*/, this.transformWeatherData(response.data)];
                                    }
                                });
                            }); }))];
                    case 1:
                        weatherData = _a.sent();
                        return [2 /*return*/, weatherData];
                    case 2:
                        error_2 = _a.sent();
                        console.error('OpenWeather historical error:', error_2);
                        throw new Error('Failed to fetch OpenWeather historical data');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OpenWeatherProvider.prototype.transformWeatherData = function (data) {
        return {
            latitude: data.lat,
            longitude: data.lon,
            timezone: data.timezone,
            current: {
                temperature: data.current.temp,
                humidity: data.current.humidity,
                windSpeed: data.current.wind_speed,
                solarRadiation: data.current.solarRadiation || 0,
            },
            daily: data.daily.map(function (day) { return ({
                date: new Date(day.dt * 1000).toISOString().split('T')[0],
                temperature: {
                    min: day.temp.min,
                    max: day.temp.max,
                },
                solarRadiation: day.solarRadiation || 0,
                precipitation: day.pop * 100,
                humidity: day.humidity,
            }); }),
        };
    };
    OpenWeatherProvider.prototype.generateDateRange = function (startDate, endDate) {
        var dates = [];
        var start = new Date(startDate);
        var end = new Date(endDate);
        while (start <= end) {
            dates.push(start.toISOString().split('T')[0]);
            start.setDate(start.getDate() + 1);
        }
        return dates;
    };
    return OpenWeatherProvider;
}());
exports.OpenWeatherProvider = OpenWeatherProvider;
var NRELProvider = /** @class */ (function () {
    function NRELProvider() {
        this.baseUrl = 'https://developer.nrel.gov/api/solar/solar_resource/v1.json';
    }
    NRELProvider.prototype.getCurrentWeather = function (latitude, longitude) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get(this.baseUrl, {
                                params: {
                                    api_key: config_1.config.nrelApiKey,
                                    lat: latitude,
                                    lon: longitude,
                                    attribute: 'ghi,air_temperature,wind_speed',
                                    timeframe: 'hourly',
                                    leap_year: 'false',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        data = response.data;
                        return [2 /*return*/, {
                                latitude: latitude,
                                longitude: longitude,
                                timezone: data.timezone,
                                current: {
                                    temperature: data.station.air_temperature,
                                    humidity: data.station.relative_humidity,
                                    windSpeed: data.station.wind_speed,
                                    solarRadiation: data.station.ghi,
                                },
                                daily: [], // NREL doesn't provide daily data in this format
                            }];
                    case 2:
                        error_3 = _a.sent();
                        console.error('NREL error:', error_3);
                        throw new Error('Failed to fetch NREL data');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NRELProvider.prototype.getHistoricalWeather = function (latitude, longitude, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, monthlyData, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get(this.baseUrl, {
                                params: {
                                    api_key: config_1.config.nrelApiKey,
                                    lat: latitude,
                                    lon: longitude,
                                    start_year: new Date(startDate).getFullYear(),
                                    end_year: new Date(endDate).getFullYear(),
                                    attribute: 'ghi,air_temperature,wind_speed',
                                    timeframe: 'monthly',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        data = response.data;
                        monthlyData = data.monthly.map(function (month) { return ({
                            date: month.month,
                            temperature: {
                                min: month.air_temperature_min,
                                max: month.air_temperature_max,
                            },
                            solarRadiation: month.ghi,
                            precipitation: month.precipitation,
                            humidity: month.relative_humidity,
                        }); });
                        return [2 /*return*/, [{
                                    latitude: latitude,
                                    longitude: longitude,
                                    timezone: data.timezone,
                                    current: {
                                        temperature: data.station.air_temperature,
                                        humidity: data.station.relative_humidity,
                                        windSpeed: data.station.wind_speed,
                                        solarRadiation: data.station.ghi,
                                    },
                                    daily: monthlyData,
                                }]];
                    case 2:
                        error_4 = _a.sent();
                        console.error('NREL historical error:', error_4);
                        throw new Error('Failed to fetch NREL historical data');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NRELProvider;
}());
exports.NRELProvider = NRELProvider;
var NASAPOWERProvider = /** @class */ (function () {
    function NASAPOWERProvider() {
        this.baseUrl = 'https://power.larc.nasa.gov/api/temporal';
    }
    NASAPOWERProvider.prototype.getCurrentWeather = function (latitude, longitude) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, latestDay, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/daily"), {
                                params: {
                                    parameters: 'ALLSKY_SFC_SW_DWN,WS50M,T2M,RH2M',
                                    community: 'RE',
                                    format: 'JSON',
                                    lat: latitude,
                                    lon: longitude,
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        data = response.data;
                        latestDay = data.properties.parameter.ALLSKY_SFC_SW_DWN[data.properties.parameter.ALLSKY_SFC_SW_DWN.length - 1];
                        return [2 /*return*/, {
                                latitude: latitude,
                                longitude: longitude,
                                timezone: 'UTC',
                                current: {
                                    temperature: data.properties.parameter.T2M[data.properties.parameter.T2M.length - 1],
                                    humidity: data.properties.parameter.RH2M[data.properties.parameter.RH2M.length - 1],
                                    windSpeed: data.properties.parameter.WS50M[data.properties.parameter.WS50M.length - 1],
                                    solarRadiation: latestDay,
                                },
                                daily: [],
                            }];
                    case 2:
                        error_5 = _a.sent();
                        console.error('NASA POWER error:', error_5);
                        throw new Error('Failed to fetch NASA POWER data');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NASAPOWERProvider.prototype.getHistoricalWeather = function (latitude, longitude, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data_1, dailyData, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/daily"), {
                                params: {
                                    parameters: 'ALLSKY_SFC_SW_DWN,WS50M,T2M,RH2M',
                                    community: 'RE',
                                    format: 'JSON',
                                    lat: latitude,
                                    lon: longitude,
                                    start: startDate,
                                    end: endDate,
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        data_1 = response.data;
                        dailyData = Object.entries(data_1.properties.parameter.ALLSKY_SFC_SW_DWN).map(function (_a) {
                            var date = _a[0], radiation = _a[1];
                            return ({
                                date: date,
                                temperature: {
                                    min: data_1.properties.parameter.T2M[date],
                                    max: data_1.properties.parameter.T2M[date],
                                },
                                solarRadiation: radiation,
                                precipitation: 0,
                                humidity: data_1.properties.parameter.RH2M[date],
                            });
                        });
                        return [2 /*return*/, [{
                                    latitude: latitude,
                                    longitude: longitude,
                                    timezone: 'UTC',
                                    current: {
                                        temperature: data_1.properties.parameter.T2M[data_1.properties.parameter.T2M.length - 1],
                                        humidity: data_1.properties.parameter.RH2M[data_1.properties.parameter.RH2M.length - 1],
                                        windSpeed: data_1.properties.parameter.WS50M[data_1.properties.parameter.WS50M.length - 1],
                                        solarRadiation: data_1.properties.parameter.ALLSKY_SFC_SW_DWN[data_1.properties.parameter.ALLSKY_SFC_SW_DWN.length - 1],
                                    },
                                    daily: dailyData,
                                }]];
                    case 2:
                        error_6 = _a.sent();
                        console.error('NASA POWER historical error:', error_6);
                        throw new Error('Failed to fetch NASA POWER historical data');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NASAPOWERProvider;
}());
exports.NASAPOWERProvider = NASAPOWERProvider;
