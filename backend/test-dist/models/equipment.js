"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEquipmentModel = void 0;
var sequelize_1 = require("sequelize");
var initEquipmentModel = function (sequelize) {
    var Equipment = sequelize.define('Equipment', {
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
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        powerRating: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        quantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        hoursPerDay: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        hoursPerNight: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        timeOfDay: {
            type: sequelize_1.DataTypes.ENUM('morning', 'afternoon', 'evening', 'night'),
            allowNull: false,
            defaultValue: 'morning',
        },
        weeklyUsage: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 7,
        },
        category: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        critical: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        modelName: 'Equipment',
        tableName: 'equipment',
        timestamps: true,
    });
    return Equipment;
};
exports.initEquipmentModel = initEquipmentModel;
