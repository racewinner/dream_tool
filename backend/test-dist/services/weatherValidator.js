"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherValidator = void 0;
var WeatherValidator = /** @class */ (function () {
    function WeatherValidator() {
        this.MAX_TEMPERATURE = 50;
        this.MIN_TEMPERATURE = -50;
        this.MAX_WIND_SPEED = 150;
        this.MAX_SOLAR_RADIATION = 1200;
        this.MAX_HUMIDITY = 100;
        this.MAX_PRECIPITATION = 100;
    }
    WeatherValidator.getInstance = function () {
        if (!WeatherValidator.instance) {
            WeatherValidator.instance = new WeatherValidator();
        }
        return WeatherValidator.instance;
    };
    WeatherValidator.prototype.validateWeatherData = function (data) {
        var _this = this;
        if (!data)
            return false;
        // Validate current weather
        var isValidCurrent = this.validateCurrentWeather(data.current);
        if (!isValidCurrent)
            return false;
        // Validate daily data
        if (data.daily) {
            var isValidDaily = data.daily.every(function (day) { return _this.validateDailyWeather(day); });
            if (!isValidDaily)
                return false;
        }
        return true;
    };
    WeatherValidator.prototype.validateCurrentWeather = function (current) {
        if (!current)
            return false;
        // Temperature
        if (typeof current.temperature !== 'number' ||
            current.temperature < this.MIN_TEMPERATURE ||
            current.temperature > this.MAX_TEMPERATURE) {
            return false;
        }
        // Humidity
        if (typeof current.humidity !== 'number' ||
            current.humidity < 0 ||
            current.humidity > this.MAX_HUMIDITY) {
            return false;
        }
        // Wind Speed
        if (typeof current.windSpeed !== 'number' ||
            current.windSpeed < 0 ||
            current.windSpeed > this.MAX_WIND_SPEED) {
            return false;
        }
        // Solar Radiation
        if (typeof current.solarRadiation !== 'number' ||
            current.solarRadiation < 0 ||
            current.solarRadiation > this.MAX_SOLAR_RADIATION) {
            return false;
        }
        return true;
    };
    WeatherValidator.prototype.validateDailyWeather = function (day) {
        var _a, _b;
        if (!day)
            return false;
        // Temperature
        if (typeof ((_a = day.temperature) === null || _a === void 0 ? void 0 : _a.min) !== 'number' ||
            typeof ((_b = day.temperature) === null || _b === void 0 ? void 0 : _b.max) !== 'number' ||
            day.temperature.min > day.temperature.max ||
            day.temperature.min < this.MIN_TEMPERATURE ||
            day.temperature.max > this.MAX_TEMPERATURE) {
            return false;
        }
        // Solar Radiation
        if (typeof day.solarRadiation !== 'number' ||
            day.solarRadiation < 0 ||
            day.solarRadiation > this.MAX_SOLAR_RADIATION) {
            return false;
        }
        // Precipitation
        if (typeof day.precipitation !== 'number' ||
            day.precipitation < 0 ||
            day.precipitation > this.MAX_PRECIPITATION) {
            return false;
        }
        // Humidity
        if (typeof day.humidity !== 'number' ||
            day.humidity < 0 ||
            day.humidity > this.MAX_HUMIDITY) {
            return false;
        }
        return true;
    };
    WeatherValidator.prototype.validateCoordinates = function (latitude, longitude) {
        if (typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180) {
            return false;
        }
        return true;
    };
    WeatherValidator.prototype.validateDateRange = function (startDate, endDate) {
        try {
            var start = new Date(startDate);
            var end = new Date(endDate);
            var now = new Date();
            var MAX_RANGE_MILLISECONDS = 365 * 24 * 60 * 60 * 1000; // Max 1 year range
            if (isNaN(start.getTime()) || isNaN(end.getTime()))
                return false;
            if (end < start)
                return false;
            if (end > now)
                return false;
            if ((end.getTime() - start.getTime()) > MAX_RANGE_MILLISECONDS)
                return false;
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    return WeatherValidator;
}());
exports.WeatherValidator = WeatherValidator;
