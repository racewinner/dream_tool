"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registration = exports.passwordResetRequest = exports.twoFactor = exports.login = void 0;
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Login rate limiter
exports.login = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many failed login attempts from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
// 2FA verification rate limiter
exports.twoFactor = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many failed 2FA attempts from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
// Password reset request rate limiter
exports.passwordResetRequest = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many password reset requests from this IP. Please try again tomorrow.',
    standardHeaders: true,
    legacyHeaders: false,
});
// Registration rate limiter
exports.registration = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many registration attempts from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
