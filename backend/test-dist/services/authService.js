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
exports.AuthService = void 0;
var config_1 = require("../config");
var auth_1 = require("../types/auth");
var jsonwebtoken_1 = require("jsonwebtoken");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var uuid_1 = require("uuid");
var ioredis_1 = require("ioredis");
var AuthService = /** @class */ (function () {
    function AuthService() {
        this.JWT_SECRET = config_1.config.jwt.secret;
        this.JWT_EXPIRES_IN = config_1.config.jwt.expiresIn;
        this.PASSWORD_SALT_ROUNDS = 10;
        this.redis = new ioredis_1.Redis({
            host: config_1.config.database.host,
            port: config_1.config.database.port,
            password: config_1.config.database.password,
        });
    }
    AuthService.getInstance = function () {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    };
    AuthService.prototype.generateToken = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: user.id,
                            email: user.email,
                            role: user.role,
                            iat: Math.floor(Date.now() / 1000),
                            exp: Math.floor(Date.now() / 1000) + parseInt(this.JWT_EXPIRES_IN),
                        };
                        token = (0, jsonwebtoken_1.sign)(payload, this.JWT_SECRET);
                        return [4 /*yield*/, this.redis.set("token:".concat(token), JSON.stringify(payload), 'EX', parseInt(this.JWT_EXPIRES_IN))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, token];
                }
            });
        });
    };
    AuthService.prototype.verifyToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, cachedPayload, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        payload = (0, jsonwebtoken_1.verify)(token, this.JWT_SECRET);
                        return [4 /*yield*/, this.redis.get("token:".concat(token))];
                    case 1:
                        cachedPayload = _a.sent();
                        if (!cachedPayload) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, JSON.parse(cachedPayload)];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.hashPassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, bcryptjs_1.default.hash(password, this.PASSWORD_SALT_ROUNDS)];
            });
        });
    };
    AuthService.prototype.comparePasswords = function (password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, bcryptjs_1.default.compare(password, hashedPassword)];
            });
        });
    };
    AuthService.prototype.generateResetToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = (0, uuid_1.v4)();
                        return [4 /*yield*/, this.redis.set("reset_token:".concat(token), 'valid', 'EX', 3600)];
                    case 1:
                        _a.sent(); // 1 hour expiry
                        return [2 /*return*/, token];
                }
            });
        });
    };
    AuthService.prototype.validateResetToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var isValid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.redis.get("reset_token:".concat(token))];
                    case 1:
                        isValid = _a.sent();
                        if (!isValid) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.redis.del("reset_token:".concat(token))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    AuthService.prototype.invalidateToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.redis.del("token:".concat(token))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.invalidateAllTokens = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, _i, keys_1, key, payload, jwtPayload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.redis.keys('token:*')];
                    case 1:
                        keys = _a.sent();
                        _i = 0, keys_1 = keys;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keys_1.length)) return [3 /*break*/, 6];
                        key = keys_1[_i];
                        return [4 /*yield*/, this.redis.get(key)];
                    case 3:
                        payload = _a.sent();
                        if (!payload) return [3 /*break*/, 5];
                        jwtPayload = JSON.parse(payload);
                        if (!(jwtPayload.userId === userId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.redis.del(key)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.getPermissions = function (role) {
        return __awaiter(this, void 0, void 0, function () {
            var permissions;
            var _a;
            return __generator(this, function (_b) {
                permissions = (_a = {},
                    _a[auth_1.UserRole.ADMIN] = ['*'],
                    _a[auth_1.UserRole.MANAGER] = ['survey:read', 'survey:write', 'user:read'],
                    _a[auth_1.UserRole.ANALYST] = ['survey:read', 'analysis:read'],
                    _a[auth_1.UserRole.USER] = ['survey:read'],
                    _a);
                return [2 /*return*/, permissions[role] || []];
            });
        });
    };
    AuthService.prototype.logActivity = function (userId, action, resource, details) {
        return __awaiter(this, void 0, void 0, function () {
            var log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log = {
                            userId: userId,
                            action: action,
                            resource: resource,
                            timestamp: new Date(),
                            details: details
                        };
                        return [4 /*yield*/, this.redis.rpush('audit_logs', JSON.stringify(log))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return AuthService;
}());
exports.AuthService = AuthService;
