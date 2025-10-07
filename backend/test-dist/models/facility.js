"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFacilityModel = void 0;
var sequelize_1 = require("sequelize");
var initFacilityModel = function (sequelize) {
    return sequelize.define('Facility', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('healthcare', 'education', 'community'),
            allowNull: false,
        },
        latitude: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        longitude: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('survey', 'design', 'installed'),
            defaultValue: 'survey',
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
        modelName: 'Facility',
        tableName: 'facilities',
        timestamps: true,
    });
};
exports.initFacilityModel = initFacilityModel;
