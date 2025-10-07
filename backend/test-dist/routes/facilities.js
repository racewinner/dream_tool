"use strict";
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
var facility_1 = require("../models/facility");
var technoEconomicAnalysis_1 = require("../models/technoEconomicAnalysis");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Get all facilities
router.get('/', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facilities, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, facility_1.Facility.findAll({
                        attributes: ['id', 'name', 'type', 'latitude', 'longitude', 'status'],
                        order: [['createdAt', 'DESC']],
                    })];
            case 1:
                facilities = _a.sent();
                res.json(facilities);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: 'Error fetching facilities' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a single facility
router.get('/:id', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facility, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, facility_1.Facility.findByPk(req.params.id, {
                        attributes: ['id', 'name', 'type', 'latitude', 'longitude', 'status'],
                        include: [
                            {
                                model: technoEconomicAnalysis_1.TechnoEconomicAnalysis,
                                attributes: ['id', 'dailyUsage', 'peakHours', 'createdAt'],
                            },
                        ],
                    })];
            case 1:
                facility = _a.sent();
                if (!facility) {
                    return [2 /*return*/, res.status(404).json({ error: 'Facility not found' })];
                }
                res.json(facility);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ error: 'Error fetching facility' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new facility
router.post('/', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facility, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, facility_1.Facility.create(req.body)];
            case 1:
                facility = _a.sent();
                res.status(201).json(facility);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(400).json({ error: 'Error creating facility' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update a facility
router.put('/:id', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facility, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, facility_1.Facility.findByPk(req.params.id)];
            case 1:
                facility = _a.sent();
                if (!facility) {
                    return [2 /*return*/, res.status(404).json({ error: 'Facility not found' })];
                }
                return [4 /*yield*/, facility.update(req.body)];
            case 2:
                _a.sent();
                res.json(facility);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                res.status(400).json({ error: 'Error updating facility' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Delete a facility
router.delete('/:id', auth_1.verifyToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facility, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, facility_1.Facility.findByPk(req.params.id)];
            case 1:
                facility = _a.sent();
                if (!facility) {
                    return [2 /*return*/, res.status(404).json({ error: 'Facility not found' })];
                }
                return [4 /*yield*/, facility.destroy()];
            case 2:
                _a.sent();
                res.status(204).send();
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                res.status(500).json({ error: 'Error deleting facility' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
