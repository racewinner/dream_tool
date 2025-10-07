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
exports.TechnoEconomicAnalysis = void 0;
var sequelize_1 = require("sequelize");
var sequelize_2 = __importDefault(require("../config/sequelize"));
var facility_1 = require("./facility");
var TechnoEconomicAnalysis = /** @class */ (function (_super) {
    __extends(TechnoEconomicAnalysis, _super);
    function TechnoEconomicAnalysis() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TechnoEconomicAnalysis;
}(sequelize_1.Model));
exports.TechnoEconomicAnalysis = TechnoEconomicAnalysis;
TechnoEconomicAnalysis.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    facilityId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: facility_1.Facility,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    dailyUsage: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    peakHours: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    batteryAutonomyFactor: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 1.0
    },
    batteryDepthOfDischarge: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0.8
    },
    batteryType: {
        type: sequelize_1.DataTypes.ENUM('lithium', 'lead_acid'),
        defaultValue: 'lithium'
    },
    inverterEfficiency: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0.94
    },
    costingMethod: {
        type: sequelize_1.DataTypes.ENUM('perWatt', 'fixedVariable', 'componentBased'),
        allowNull: false
    },
    panelCostPerWatt: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    panelCostPerKw: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    batteryCostPerKwh: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    inverterCostPerKw: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    structureCostPerKw: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    fixedCosts: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    numPanels: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    panelRating: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    pvInitialCost: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    pvAnnualMaintenance: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    pvLifecycleCost: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    pvNpv: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    pvIrr: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    dieselInitialCost: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    dieselAnnualMaintenance: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    dieselLifecycleCost: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    dieselNpv: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    dieselIrr: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
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
    sequelize: sequelize_2.default,
    modelName: 'TechnoEconomicAnalysis',
    tableName: 'techno_economic_analyses',
    timestamps: true,
});
// Define associations
facility_1.Facility.hasMany(TechnoEconomicAnalysis, {
    foreignKey: 'facilityId',
    as: 'analyses',
});
TechnoEconomicAnalysis.belongsTo(facility_1.Facility, {
    foreignKey: 'facilityId',
    as: 'facility',
});
