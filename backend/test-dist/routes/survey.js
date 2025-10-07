"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var models_1 = require("../models");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Get all surveys for a facility
router.get('/:facilityId', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facilityId, surveys, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                facilityId = req.params.facilityId;
                return [4 /*yield*/, models_1.Survey.findAll({
                        where: { facilityId: facilityId },
                        include: [
                            {
                                model: models_1.SurveyVersion,
                                as: 'versions',
                                order: [['version', 'DESC']],
                            },
                            {
                                model: models_1.Equipment,
                                as: 'equipment',
                            },
                        ],
                        order: [['createdAt', 'DESC']],
                    })];
            case 1:
                surveys = _a.sent();
                res.json(surveys);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch surveys' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create new survey
router.post('/:facilityId', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facilityId, _a, facilityData_1, equipment, requiredFields, missingFields, survey_1, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                facilityId = req.params.facilityId;
                _a = req.body, facilityData_1 = _a.facilityData, equipment = _a.equipment;
                requiredFields = ['productiveSectors', 'operationalHours', 'infrastructure'];
                missingFields = requiredFields.filter(function (field) { return !facilityData_1[field]; });
                if (missingFields.length > 0) {
                    return [2 /*return*/, res.status(400).json({ error: "Missing required fields: ".concat(missingFields.join(', ')) })];
                }
                return [4 /*yield*/, models_1.Survey.create({
                        facilityId: facilityId,
                        facilityData: facilityData_1,
                    })];
            case 1:
                survey_1 = _b.sent();
                // Create initial version
                return [4 /*yield*/, models_1.SurveyVersion.create({
                        surveyId: survey_1.id,
                        version: 1,
                        status: 'draft',
                        createdBy: req.user.username,
                    })];
            case 2:
                // Create initial version
                _b.sent();
                if (!(equipment && Array.isArray(equipment))) return [3 /*break*/, 4];
                return [4 /*yield*/, models_1.Equipment.bulkCreate(equipment.map(function (item) { return (__assign(__assign({}, item), { surveyId: survey_1.id })); }))];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                res.status(201).json(survey_1);
                return [3 /*break*/, 6];
            case 5:
                error_2 = _b.sent();
                res.status(500).json({ error: 'Failed to create survey' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Update survey
router.put('/:id', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var surveyId_1, _a, facilityData, equipment, survey, latestVersion, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                surveyId_1 = req.params.id;
                _a = req.body, facilityData = _a.facilityData, equipment = _a.equipment;
                return [4 /*yield*/, models_1.Survey.findByPk(surveyId_1)];
            case 1:
                survey = _b.sent();
                if (!survey) {
                    return [2 /*return*/, res.status(404).json({ error: 'Survey not found' })];
                }
                return [4 /*yield*/, models_1.SurveyVersion.findOne({
                        where: { surveyId: surveyId_1 },
                        order: [['version', 'DESC']],
                    })];
            case 2:
                latestVersion = _b.sent();
                return [4 /*yield*/, models_1.SurveyVersion.create({
                        surveyId: surveyId_1,
                        version: latestVersion.version + 1,
                        status: 'draft',
                        createdBy: req.user.username,
                        notes: 'Updated survey data',
                    })];
            case 3:
                _b.sent();
                // Update survey data
                return [4 /*yield*/, survey.update({ facilityData: facilityData })];
            case 4:
                // Update survey data
                _b.sent();
                if (!(equipment && Array.isArray(equipment))) return [3 /*break*/, 7];
                return [4 /*yield*/, models_1.Equipment.destroy({ where: { surveyId: surveyId_1 } })];
            case 5:
                _b.sent();
                return [4 /*yield*/, models_1.Equipment.bulkCreate(equipment.map(function (item) { return (__assign(__assign({}, item), { surveyId: surveyId_1 })); }))];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7:
                res.json(survey);
                return [3 /*break*/, 9];
            case 8:
                error_3 = _b.sent();
                res.status(500).json({ error: 'Failed to update survey' });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// Get survey analysis
router.get('/:id/analysis', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var surveyId, survey, calculateDailyUsage, dailyUsage, operationalHours, peakHours, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                surveyId = req.params.id;
                return [4 /*yield*/, models_1.Survey.findByPk(surveyId, {
                        include: [
                            {
                                model: models_1.Equipment,
                                as: 'equipment',
                            },
                        ],
                    })];
            case 1:
                survey = _a.sent();
                if (!survey) {
                    return [2 /*return*/, res.status(404).json({ error: 'Survey not found' })];
                }
                calculateDailyUsage = function (equipment) {
                    return equipment.reduce(function (total, item) {
                        var powerRating = item.powerRating, quantity = item.quantity, hoursPerDay = item.hoursPerDay, hoursPerNight = item.hoursPerNight, weeklyUsage = item.weeklyUsage, timeOfDay = item.timeOfDay;
                        var weeklyDays = 7;
                        var availabilityFactor = weeklyUsage / weeklyDays;
                        var dailyEnergy = ((hoursPerDay + hoursPerNight) *
                            powerRating *
                            quantity *
                            availabilityFactor) / 1000;
                        var timeOfDayFactor = 1.0;
                        if (timeOfDay === 'evening') {
                            timeOfDayFactor = 1.2;
                        }
                        else if (timeOfDay === 'night') {
                            timeOfDayFactor = 0.8;
                        }
                        return total + (dailyEnergy * timeOfDayFactor);
                    }, 0);
                };
                dailyUsage = calculateDailyUsage(survey.equipment);
                operationalHours = survey.facilityData.operationalHours;
                peakHours = Math.max(operationalHours.day, operationalHours.night) * 0.85;
                res.json({
                    dailyUsage: dailyUsage,
                    peakHours: peakHours,
                    equipment: survey.equipment,
                    facilityData: survey.facilityData,
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                res.status(500).json({ error: 'Failed to analyze survey' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
