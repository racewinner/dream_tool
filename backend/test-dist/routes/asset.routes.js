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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var models_1 = require("../models");
var auth_1 = require("../middleware/auth");
var router = express_1.default.Router();
// Get all assets
router.get('/', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var assets, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.Asset.findAll({
                        include: [
                            {
                                model: models_1.Facility,
                                as: 'facility',
                            },
                            {
                                model: models_1.Maintenance,
                                as: 'maintenances',
                                order: [['date', 'DESC']],
                            },
                        ],
                    })];
            case 1:
                assets = _a.sent();
                res.json(assets);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch assets' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get asset by ID
router.get('/:id', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var asset, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.Asset.findOne({
                        where: { id: req.params.id },
                        include: [
                            {
                                model: models_1.Facility,
                                as: 'facility',
                            },
                            {
                                model: models_1.Maintenance,
                                as: 'maintenances',
                                order: [['date', 'DESC']],
                            },
                        ],
                    })];
            case 1:
                asset = _a.sent();
                if (!asset) {
                    return [2 /*return*/, res.status(404).json({ error: 'Asset not found' })];
                }
                res.json(asset);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch asset' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create new asset
router.post('/', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, facilityId, pvCapacity, batteryCapacity, inverterType, installationDate, asset, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, facilityId = _a.facilityId, pvCapacity = _a.pvCapacity, batteryCapacity = _a.batteryCapacity, inverterType = _a.inverterType, installationDate = _a.installationDate;
                // Validate required fields
                if (!facilityId || !pvCapacity || !batteryCapacity || !inverterType || !installationDate) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                return [4 /*yield*/, models_1.Asset.create({
                        facilityId: facilityId,
                        pvCapacity: pvCapacity,
                        batteryCapacity: batteryCapacity,
                        inverterType: inverterType,
                        installationDate: installationDate,
                        status: 'active',
                    })];
            case 1:
                asset = _b.sent();
                res.status(201).json(asset);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                res.status(500).json({ error: 'Failed to create asset' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update asset
router.put('/:id', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var asset, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, models_1.Asset.findByPk(req.params.id)];
            case 1:
                asset = _a.sent();
                if (!asset) {
                    return [2 /*return*/, res.status(404).json({ error: 'Asset not found' })];
                }
                return [4 /*yield*/, asset.update(req.body)];
            case 2:
                _a.sent();
                res.json(asset);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                res.status(500).json({ error: 'Failed to update asset' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Delete asset
router.delete('/:id', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var asset, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, models_1.Asset.findByPk(req.params.id)];
            case 1:
                asset = _a.sent();
                if (!asset) {
                    return [2 /*return*/, res.status(404).json({ error: 'Asset not found' })];
                }
                return [4 /*yield*/, asset.destroy()];
            case 2:
                _a.sent();
                res.status(204).send();
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                res.status(500).json({ error: 'Failed to delete asset' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Add maintenance log
router.post('/:id/maintenance', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, issue, resolution, technician, assetId, maintenance, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, issue = _a.issue, resolution = _a.resolution, technician = _a.technician;
                assetId = req.params.id;
                // Validate required fields
                if (!issue || !resolution || !technician) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                return [4 /*yield*/, models_1.Maintenance.create({
                        assetId: assetId,
                        issue: issue,
                        resolution: resolution,
                        technician: technician,
                        date: new Date(),
                    })];
            case 1:
                maintenance = _b.sent();
                // Update asset's last maintenance date
                return [4 /*yield*/, models_1.Asset.update({ lastMaintenance: new Date(), nextMaintenance: calculateNextMaintenanceDate() }, { where: { id: assetId } })];
            case 2:
                // Update asset's last maintenance date
                _b.sent();
                res.status(201).json(maintenance);
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                res.status(500).json({ error: 'Failed to add maintenance log' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get maintenance history
router.get('/:id/maintenance', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var maintenances, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.Maintenance.findAll({
                        where: { assetId: req.params.id },
                        order: [['date', 'DESC']],
                    })];
            case 1:
                maintenances = _a.sent();
                res.json(maintenances);
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch maintenance history' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Helper function to calculate next maintenance date
function calculateNextMaintenanceDate() {
    var now = new Date();
    now.setMonth(now.getMonth() + 6); // Next maintenance in 6 months
    return now;
}
exports.default = router;
