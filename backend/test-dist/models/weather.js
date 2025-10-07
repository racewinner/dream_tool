"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWeatherModel = void 0;
var sequelize_1 = require("sequelize");
var initWeatherModel = function (sequelize) {
    return sequelize.define('Weather', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        facilityId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'facilities',
                key: 'id',
            },
        },
        date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        temperature: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        humidity: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        windSpeed: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        solarRadiation: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        precipitation: {
            type: sequelize_1.DataTypes.FLOAT,
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
        }
    }, {
        sequelize: sequelize,
        modelName: 'Weather',
        tableName: 'weather_data',
        timestamps: true,
        underscored: true,
    });
};
exports.initWeatherModel = initWeatherModel;
