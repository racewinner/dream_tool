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
exports.initUserModel = void 0;
var sequelize_1 = require("sequelize");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var speakeasy_1 = __importDefault(require("speakeasy"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var initUserModel = function (sequelize) {
    var User = sequelize.define('User', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        firstName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: sequelize_1.DataTypes.ENUM('admin', 'manager', 'user'),
            defaultValue: 'user',
            allowNull: false,
        },
        isVerified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        verificationToken: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        verificationTokenExpiresAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        is2faEnabled: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        twoFactorSecret: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        recoveryCodes: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: true,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        tableName: 'users',
        timestamps: true,
    });
    // Instance methods
    User.prototype.comparePassword = function (candidatePassword) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, bcryptjs_1.default.compare(candidatePassword, this.password)];
            });
        });
    };
    User.prototype.generateAuthToken = function () {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign({ id: this.id, email: this.email, role: this.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    };
    User.prototype.generateVerificationToken = function () {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign({ id: this.id, email: this.email }, process.env.JWT_SECRET + this.password, { expiresIn: '1d' });
    };
    User.prototype.generate2FASecret = function () {
        var secret = speakeasy_1.default.generateSecret({
            name: "DREAM_TOOL:".concat(this.email),
            length: 20
        });
        this.twoFactorSecret = secret.base32;
        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url
        };
    };
    User.prototype.verify2FAToken = function (token) {
        if (!this.twoFactorSecret)
            return false;
        return speakeasy_1.default.totp.verify({
            secret: this.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1
        });
    };
    User.prototype.generateRecoveryCodes = function () {
        var codes = [];
        for (var i = 0; i < 10; i++) {
            codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
        }
        this.recoveryCodes = codes;
        return codes;
    };
    User.prototype.verifyRecoveryCode = function (code) {
        if (!this.recoveryCodes)
            return false;
        var index = this.recoveryCodes.indexOf(code);
        if (index === -1)
            return false;
        // Remove the used code
        this.recoveryCodes.splice(index, 1);
        return true;
    };
    User.prototype.generateToken = function () {
        return this.generateAuthToken();
    };
    // Hooks
    User.beforeCreate(function (user) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!user.password) return [3 /*break*/, 2];
                    _a = user;
                    return [4 /*yield*/, bcryptjs_1.default.hash(user.password, 10)];
                case 1:
                    _a.password = _b.sent();
                    _b.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); });
    User.beforeUpdate(function (user) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(user.changed('password') && user.password)) return [3 /*break*/, 2];
                    _a = user;
                    return [4 /*yield*/, bcryptjs_1.default.hash(user.password, 10)];
                case 1:
                    _a.password = _b.sent();
                    _b.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); });
    return User;
};
exports.initUserModel = initUserModel;
