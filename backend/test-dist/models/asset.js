"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAssetModel = void 0;
var sequelize_1 = require("sequelize");
var initAssetModel = function (sequelize) {
    var Asset = sequelize.define('Asset', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        facilityId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Facilities',
                key: 'id',
            },
        },
        pvCapacity: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        batteryCapacity: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        inverterType: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        installationDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'maintenance', 'faulty'),
            defaultValue: 'active',
        },
        lastMaintenance: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        nextMaintenance: {
            type: sequelize_1.DataTypes.DATE,
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
        modelName: 'Asset',
        tableName: 'assets',
        timestamps: true,
    });
    return Asset;
};
exports.initAssetModel = initAssetModel;
