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
var axios_1 = __importDefault(require("axios"));
var router = express_1.default.Router();
// WhatsApp API configuration
var WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com';
var WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
// Send message to WhatsApp
router.post('/send', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, phoneNumber, message, facilityId, whatsappMessage, error_1, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                _a = req.body, phoneNumber = _a.phoneNumber, message = _a.message, facilityId = _a.facilityId;
                if (!phoneNumber || !message || !facilityId) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                return [4 /*yield*/, models_1.WhatsApp.create({
                        facilityId: facilityId,
                        phoneNumber: phoneNumber,
                        message: message,
                        direction: 'out',
                        status: 'sent',
                    })];
            case 1:
                whatsappMessage = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 5, , 7]);
                return [4 /*yield*/, axios_1.default.post("".concat(WHATSAPP_API_URL, "/v1/messages"), {
                        messaging_product: 'whatsapp',
                        to: phoneNumber,
                        type: 'text',
                        text: { body: message },
                    }, {
                        headers: {
                            'Authorization': "Bearer ".concat(WHATSAPP_API_TOKEN),
                            'Content-Type': 'application/json',
                        },
                    })];
            case 3:
                _b.sent();
                return [4 /*yield*/, whatsappMessage.update({ status: 'delivered' })];
            case 4:
                _b.sent();
                res.status(201).json(whatsappMessage);
                return [3 /*break*/, 7];
            case 5:
                error_1 = _b.sent();
                return [4 /*yield*/, whatsappMessage.update({ status: 'failed' })];
            case 6:
                _b.sent();
                throw error_1;
            case 7: return [3 /*break*/, 9];
            case 8:
                error_2 = _b.sent();
                res.status(500).json({ error: 'Failed to send WhatsApp message' });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// Get message history for a facility
router.get('/facility/:facilityId', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var messages, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.WhatsApp.findAll({
                        where: { facilityId: req.params.facilityId },
                        order: [['createdAt', 'DESC']],
                        include: [{
                                model: models_1.Facility,
                                as: 'facility',
                            }],
                    })];
            case 1:
                messages = _a.sent();
                res.json(messages);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch message history' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get facility phone number
router.get('/facility/:facilityId/phone', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var facility, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.Facility.findOne({
                        where: { id: req.params.facilityId },
                        attributes: ['phoneNumber'],
                    })];
            case 1:
                facility = _a.sent();
                if (!facility) {
                    return [2 /*return*/, res.status(404).json({ error: 'Facility not found' })];
                }
                res.json({ phoneNumber: facility.phoneNumber });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch facility phone number' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Webhook for receiving WhatsApp messages
router.post('/webhook', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, messaging_product, metadata, contacts, messages, message, contact, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, messaging_product = _a.messaging_product, metadata = _a.metadata, contacts = _a.contacts, messages = _a.messages;
                if (messaging_product !== 'whatsapp') {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid messaging product' })];
                }
                message = messages[0];
                contact = contacts[0];
                // Save incoming message
                return [4 /*yield*/, models_1.WhatsApp.create({
                        phoneNumber: contact.wa_id,
                        message: message.text.body,
                        direction: 'in',
                        status: 'received',
                    })];
            case 1:
                // Save incoming message
                _b.sent();
                // Process incoming message (e.g., triage issues, respond to common queries)
                return [4 /*yield*/, processIncomingMessage(message.text.body, contact.wa_id)];
            case 2:
                // Process incoming message (e.g., triage issues, respond to common queries)
                _b.sent();
                res.status(200).send('OK');
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                res.status(500).json({ error: 'Failed to process incoming message' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Helper function to process incoming messages
function processIncomingMessage(message, phoneNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var keywords, _i, _a, _b, keyword, issueType;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    keywords = {
                        'system not working': 'system_fault',
                        'low battery': 'battery_low',
                        'inverter': 'inverter_issue',
                        'panels': 'panel_issue',
                        'performance': 'performance_issue',
                    };
                    _i = 0, _a = Object.entries(keywords);
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    _b = _a[_i], keyword = _b[0], issueType = _b[1];
                    if (!message.toLowerCase().includes(keyword)) return [3 /*break*/, 3];
                    // Send automated response
                    return [4 /*yield*/, sendAutomatedResponse(issueType, phoneNumber)];
                case 2:
                    // Send automated response
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Send automated response based on issue type
function sendAutomatedResponse(issueType, phoneNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var responses, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    responses = {
                        system_fault: 'We received your report about the system not working. Our team will contact you shortly to assist with the issue.',
                        battery_low: 'Your battery level is low. Please check if the PV panels are clean and not obstructed. We recommend a maintenance check.',
                        inverter_issue: 'We received your inverter-related issue. Please check the inverter display for error codes and contact us for further assistance.',
                        panel_issue: 'We received your PV panel issue. Please check for any visible damage or shading on the panels. We recommend a maintenance check.',
                        performance_issue: 'We received your performance concern. Please provide more details about the specific issue you are experiencing.',
                    };
                    response = responses[issueType];
                    if (!response) return [3 /*break*/, 2];
                    return [4 /*yield*/, axios_1.default.post("".concat(WHATSAPP_API_URL, "/v1/messages"), {
                            messaging_product: 'whatsapp',
                            to: phoneNumber,
                            type: 'text',
                            text: { body: response },
                        }, {
                            headers: {
                                'Authorization': "Bearer ".concat(WHATSAPP_API_TOKEN),
                                'Content-Type': 'application/json',
                            },
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
exports.default = router;
