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
exports.twoFactorAuthService = exports.TwoFactorAuthService = void 0;
var speakeasy_1 = __importDefault(require("speakeasy"));
var qrcode_1 = __importDefault(require("qrcode"));
var user_1 = require("../models/user");
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var TwoFactorAuthService = /** @class */ (function () {
    function TwoFactorAuthService() {
    }
    TwoFactorAuthService.getInstance = function () {
        if (!TwoFactorAuthService.instance) {
            TwoFactorAuthService.instance = new TwoFactorAuthService();
        }
        return TwoFactorAuthService.instance;
    };
    TwoFactorAuthService.prototype.generateSecret = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var secret, otpauthUrl, qrCode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        secret = speakeasy_1.default.generateSecret({
                            name: "".concat(process.env.APP_NAME, " (").concat(userId, ")"),
                            length: 20,
                        });
                        otpauthUrl = secret.otpauth_url;
                        return [4 /*yield*/, qrcode_1.default.toDataURL(otpauthUrl)];
                    case 1:
                        qrCode = _a.sent();
                        return [2 /*return*/, {
                                secret: secret.base32,
                                qrCode: qrCode,
                                otpauthUrl: otpauthUrl,
                            }];
                }
            });
        });
    };
    TwoFactorAuthService.prototype.verifyToken = function (secret, token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, speakeasy_1.default.totp.verify({
                        secret: secret,
                        encoding: 'base32',
                        token: token,
                    })];
            });
        });
    };
    TwoFactorAuthService.prototype.generateRecoveryCodes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var recoveryCodes, i;
            return __generator(this, function (_a) {
                recoveryCodes = [];
                for (i = 0; i < 10; i++) {
                    recoveryCodes.push(speakeasy_1.default.generateSecret({ length: 16 }).base32);
                }
                return [2 /*return*/, recoveryCodes];
            });
        });
    };
    TwoFactorAuthService.prototype.validateRecoveryCode = function (user, code) {
        return __awaiter(this, void 0, void 0, function () {
            var codes, isValid, newCodes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!user.recoveryCodes)
                            return [2 /*return*/, false];
                        codes = user.recoveryCodes.split(',');
                        isValid = codes.includes(code);
                        if (!isValid) return [3 /*break*/, 2];
                        newCodes = codes.filter(function (c) { return c !== code; });
                        return [4 /*yield*/, user_1.User.update({ recoveryCodes: newCodes.join(',') }, { where: { id: user.id } })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, isValid];
                }
            });
        });
    };
    return TwoFactorAuthService;
}());
exports.TwoFactorAuthService = TwoFactorAuthService;
exports.twoFactorAuthService = TwoFactorAuthService.getInstance();
