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
exports.initMaintenanceRecordModel = void 0;
var sequelize_1 = require("sequelize");
// Initialize the model
var initMaintenanceRecordModel = function (sequelize) {
    var MaintenanceRecord = sequelize.define('MaintenanceRecord', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        solarSystemId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'solar_systems',
                key: 'id',
            },
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        maintenanceDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        maintenanceType: {
            type: sequelize_1.DataTypes.ENUM('ROUTINE', 'CORRECTIVE', 'PREVENTIVE'),
            allowNull: false,
        },
        maintenanceStatus: {
            type: sequelize_1.DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        maintenanceDescription: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        maintenanceCost: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        partsReplaced: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
        laborHours: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: true,
        },
        nextMaintenanceDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        maintenanceReport: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        attachments: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
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
        modelName: 'MaintenanceRecord',
        tableName: 'maintenance_records',
        timestamps: true,
    });
    // Add static methods
    MaintenanceRecord.createMaintenanceRecord = function (solarSystemId, userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var record, SolarSystem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.create(__assign(__assign({ solarSystemId: solarSystemId, userId: userId }, data), { maintenanceDate: data.maintenanceDate || new Date() }))];
                    case 1:
                        record = _a.sent();
                        SolarSystem = require('.').SolarSystem;
                        return [4 /*yield*/, SolarSystem.update({
                                status: 'ACTIVE',
                                lastMaintenanceDate: record.maintenanceDate,
                                nextMaintenanceDate: record.nextMaintenanceDate || null
                            }, {
                                where: { id: solarSystemId }
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, record];
                }
            });
        });
    };
    // Get maintenance history for a solar system
    MaintenanceRecord.getMaintenanceHistory = function (solarSystemId_1) {
        return __awaiter(this, arguments, void 0, function (solarSystemId, limit) {
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findAll({
                        where: { solarSystemId: solarSystemId },
                        order: [['maintenanceDate', 'DESC']],
                        limit: limit,
                    })];
            });
        });
    };
    // Get upcoming maintenance records
    MaintenanceRecord.getUpcomingMaintenance = function () {
        return __awaiter(this, arguments, void 0, function (daysAhead) {
            var today, targetDate;
            var _a;
            if (daysAhead === void 0) { daysAhead = 7; }
            return __generator(this, function (_b) {
                today = new Date();
                targetDate = new Date();
                targetDate.setDate(today.getDate() + daysAhead);
                return [2 /*return*/, this.findAll({
                        where: {
                            maintenanceDate: (_a = {},
                                _a[sequelize_1.Op.between] = [today, targetDate],
                                _a),
                            maintenanceStatus: 'PENDING'
                        },
                        order: [['maintenanceDate', 'ASC']]
                    })];
            });
        });
    };
    // Complete a maintenance record
    MaintenanceRecord.completeMaintenance = function (recordId, completionData) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findByPk(recordId)];
                    case 1:
                        record = _a.sent();
                        if (!record) {
                            throw new Error('Maintenance record not found');
                        }
                        return [2 /*return*/, record.update(__assign(__assign({}, completionData), { maintenanceStatus: 'COMPLETED', maintenanceDate: new Date() }))];
                }
            });
        });
    };
    // Add associations
    if ('associate' in MaintenanceRecord) {
        MaintenanceRecord.associate = function (models) {
            MaintenanceRecord.belongsTo(models.SolarSystem, {
                foreignKey: 'solarSystemId',
                as: 'solarSystem',
            });
            MaintenanceRecord.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
            });
        };
    }
    return MaintenanceRecord;
};
exports.initMaintenanceRecordModel = initMaintenanceRecordModel;
