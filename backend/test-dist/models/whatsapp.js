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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsApp = void 0;
var sequelize_1 = require("sequelize");
var _1 = require("./");
var facility_1 = require("./facility");
var WhatsApp = /** @class */ (function (_super) {
    __extends(WhatsApp, _super);
    function WhatsApp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return WhatsApp;
}(sequelize_1.Model));
exports.WhatsApp = WhatsApp;
WhatsApp.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    facilityId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: facility_1.Facility,
            key: 'id',
        },
    },
    phoneNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    direction: {
        type: sequelize_1.DataTypes.ENUM('in', 'out'),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
        defaultValue: 'sent',
    },
}, {
    sequelize: _1.sequelize,
    modelName: 'whatsapp',
    timestamps: true,
});
// Relationships
WhatsApp.belongsTo(facility_1.Facility, {
    foreignKey: 'facilityId',
    as: 'facility',
});
