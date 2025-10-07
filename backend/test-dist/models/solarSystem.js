"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolarSystem = void 0;
var sequelize_1 = require("sequelize");
var database_1 = __importDefault(require("../config/database"));
var SolarSystem = /** @class */ (function (_super) {
    __extends(SolarSystem, _super);
    function SolarSystem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SolarSystem.associate = function (models) {
        SolarSystem.belongsTo(models.Facility, {
            foreignKey: 'facilityId',
            as: 'facility'
        });
        SolarSystem.hasMany(models.MaintenanceRecord, {
            foreignKey: 'solarSystemId',
            as: 'maintenanceRecords'
        });
    };
    SolarSystem.calculatePerformanceMetrics = function (systemId) {
        return {
            dailyGeneration: 0,
            monthlyGeneration: 0,
            yearlyGeneration: 0,
            efficiency: 0,
            maintenanceCosts: {
                total: 0,
                averagePerKw: 0,
                trend: 'STABLE'
            },
            operationalHours: 0,
            downtime: {
                totalHours: 0,
                percentage: 0,
                frequency: 0
            },
            energyLoss: {
                totalKwh: 0,
                percentage: 0,
                causes: []
            },
            systemAvailability: 0,
            performanceRatio: 0,
            capacityFactor: 0
        };
    };
    return SolarSystem;
}(sequelize_1.Model));
exports.SolarSystem = SolarSystem;
SolarSystem.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    facilityId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    systemType: {
        type: sequelize_1.DataTypes.ENUM('PV', 'HYBRID', 'STANDALONE'),
        allowNull: false
    },
    capacityKw: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    installationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    commissioningDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    manufacturer: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    model: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    serialNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    warrantyPeriod: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    maintenanceSchedule: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    maintenanceFrequency: {
        type: sequelize_1.DataTypes.ENUM('MONTHLY', 'QUARTERLY', 'YEARLY'),
        allowNull: false
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'),
        allowNull: false,
        defaultValue: 'ACTIVE'
    },
    lastMaintenanceDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    nextMaintenanceDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    performanceMetrics: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            dailyGeneration: 0,
            monthlyGeneration: 0,
            yearlyGeneration: 0,
            efficiency: 0,
            maintenanceCosts: {
                total: 0,
                averagePerKw: 0,
                trend: 'STABLE'
            },
            operationalHours: 0,
            downtime: {
                totalHours: 0,
                percentage: 0,
                frequency: 0
            },
            energyLoss: {
                totalKwh: 0,
                percentage: 0,
                causes: []
            },
            systemAvailability: 0,
            performanceRatio: 0,
            capacityFactor: 0
        }
    },
    fundingSource: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    grantAmount: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    grantExpiryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    installationCost: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    maintenanceCost: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    sequelize: database_1.default,
    modelName: 'SolarSystem',
    tableName: 'solar_systems'
});
