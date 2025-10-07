"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSurveyModel = void 0;
var sequelize_1 = require("sequelize");
var initSurveyModel = function (sequelize) {
    return sequelize.define('Survey', {
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
        facilityData: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            validate: {
                isJSON: true
            }
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
        modelName: 'Survey',
        tableName: 'surveys',
        timestamps: true,
    });
};
exports.initSurveyModel = initSurveyModel;
