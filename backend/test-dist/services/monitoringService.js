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
exports.monitoring = exports.MonitoringService = void 0;
var config_1 = require("../config");
var ioredis_1 = require("ioredis");
var perf_hooks_1 = require("perf_hooks");
var util_1 = require("util");
var zlib_1 = require("zlib");
var MonitoringService = /** @class */ (function () {
    function MonitoringService() {
        var _this = this;
        this.METRIC_TTL = 86400; // 24 hours
        this.redis = new ioredis_1.Redis({
            host: config_1.config.database.host,
            port: config_1.config.database.port,
            password: config_1.config.database.password,
        });
        // Initialize performance monitoring
        this.performanceObserver = new perf_hooks_1.PerformanceObserver(function (list) {
            var entries = list.getEntries();
            entries.forEach(function (entry) {
                _this.logPerformanceMetric(entry);
            });
        });
        this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
    MonitoringService.getInstance = function () {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    };
    // Start monitoring a request
    MonitoringService.prototype.startMonitoring = function (req) {
        perf_hooks_1.performance.mark("request_start_".concat(req.id));
    };
    // End monitoring a request
    MonitoringService.prototype.endMonitoring = function (req) {
        perf_hooks_1.performance.measure("request_duration_".concat(req.id), "request_start_".concat(req.id));
    };
    // Log performance metrics
    MonitoringService.prototype.logPerformanceMetric = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            var metric, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        metric = {
                            type: entry.entryType,
                            name: entry.name,
                            duration: entry.duration,
                            startTime: entry.startTime,
                            timestamp: new Date().toISOString()
                        };
                        return [4 /*yield*/, this.redis.rpush('performance_metrics', JSON.stringify(metric))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.redis.expire('performance_metrics', this.METRIC_TTL)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error logging performance metric:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Get recent performance metrics
    MonitoringService.prototype.getRecentMetrics = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var metrics, error_2;
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.lrange('performance_metrics', 0, limit - 1)];
                    case 1:
                        metrics = _a.sent();
                        return [2 /*return*/, metrics.map(function (metric) { return JSON.parse(metric); })];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error retrieving metrics:', error_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Clear metrics
    MonitoringService.prototype.clearMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.del('performance_metrics')];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error clearing metrics:', error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Log request/response data
    MonitoringService.prototype.logRequest = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var log, compressed, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        log = {
                            timestamp: new Date().toISOString(),
                            method: req.method,
                            path: req.path,
                            status: res.statusCode,
                            duration: perf_hooks_1.performance.now() - req.startTime,
                            userAgent: req.headers['user-agent'],
                            ip: req.ip,
                            headers: req.headers,
                            query: req.query,
                            body: req.body
                        };
                        return [4 /*yield*/, (0, util_1.promisify)((0, zlib_1.createGzip)())(JSON.stringify(log))];
                    case 1:
                        compressed = _a.sent();
                        return [4 /*yield*/, this.redis.rpush('request_logs', compressed)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.redis.expire('request_logs', this.METRIC_TTL)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        console.error('Error logging request:', error_4);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Get recent request logs
    MonitoringService.prototype.getRequestLogs = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var logs, error_5;
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.lrange('request_logs', 0, limit - 1)];
                    case 1:
                        logs = _a.sent();
                        return [2 /*return*/, logs.map(function (log) { return JSON.parse(Buffer.from(log).toString()); })];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error retrieving request logs:', error_5);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Clear request logs
    MonitoringService.prototype.clearRequestLogs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.del('request_logs')];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Error clearing request logs:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Monitor API usage
    MonitoringService.prototype.logAPIUsage = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var usage, error_7;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        usage = {
                            timestamp: new Date().toISOString(),
                            endpoint: req.path,
                            method: req.method,
                            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                            ip: req.ip,
                            userAgent: req.headers['user-agent'],
                            responseTime: perf_hooks_1.performance.now() - req.startTime
                        };
                        return [4 /*yield*/, this.redis.rpush('api_usage', JSON.stringify(usage))];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.redis.expire('api_usage', this.METRIC_TTL)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _b.sent();
                        console.error('Error logging API usage:', error_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Get API usage statistics
    MonitoringService.prototype.getAPIUsageStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var usage, parsedUsage, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.lrange('api_usage', 0, -1)];
                    case 1:
                        usage = _a.sent();
                        parsedUsage = usage.map(function (u) { return JSON.parse(u); });
                        return [2 /*return*/, {
                                totalRequests: parsedUsage.length,
                                endpoints: this.getEndpointStats(parsedUsage),
                                users: this.getUserStats(parsedUsage),
                                responseTimes: this.getResponseTimeStats(parsedUsage)
                            }];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error getting API usage stats:', error_8);
                        return [2 /*return*/, {}];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MonitoringService.prototype.getEndpointStats = function (usage) {
        var stats = {};
        usage.forEach(function (u) {
            stats[u.endpoint] = (stats[u.endpoint] || 0) + 1;
        });
        return stats;
    };
    MonitoringService.prototype.getUserStats = function (usage) {
        var stats = {};
        usage.forEach(function (u) {
            if (u.user) {
                stats[u.user] = (stats[u.user] || 0) + 1;
            }
        });
        return stats;
    };
    MonitoringService.prototype.getResponseTimeStats = function (usage) {
        var times = usage.map(function (u) { return u.responseTime; }).sort(function (a, b) { return a - b; });
        return {
            average: times.reduce(function (a, b) { return a + b; }, 0) / times.length,
            min: times[0],
            max: times[times.length - 1],
            p95: times[Math.floor(times.length * 0.95)]
        };
    };
    return MonitoringService;
}());
exports.MonitoringService = MonitoringService;
exports.monitoring = MonitoringService.getInstance();
