"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMaintenanceModel = void 0;
var sequelize_1 = require("sequelize");
var initMaintenanceModel = function (sequelize) {
    var Maintenance = sequelize.define('Maintenance', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        assetId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Assets',
                key: 'id',
            },
        },
        date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        issue: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        resolution: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        technician: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
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
        modelName: 'Maintenance',
        tableName: 'maintenance',
        timestamps: true,
    });
    return Maintenance;
};
exports.initMaintenanceModel = initMaintenanceModel;
