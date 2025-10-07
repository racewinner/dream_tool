"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSurveyVersionModel = void 0;
var sequelize_1 = require("sequelize");
var initSurveyVersionModel = function (sequelize) {
    var SurveyVersion = sequelize.define('SurveyVersion', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        surveyId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Surveys',
                key: 'id',
            },
        },
        version: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('draft', 'completed', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
        },
        notes: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
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
        modelName: 'SurveyVersion',
        tableName: 'survey_versions',
        timestamps: true,
    });
    return SurveyVersion;
};
exports.initSurveyVersionModel = initSurveyVersionModel;
