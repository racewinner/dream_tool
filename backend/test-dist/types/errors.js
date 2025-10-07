"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    // Authentication errors
    ErrorCode["UNAUTHORIZED"] = "AUTH_001";
    ErrorCode["INVALID_TOKEN"] = "AUTH_002";
    ErrorCode["USER_NOT_FOUND"] = "AUTH_003";
    ErrorCode["INVALID_CREDENTIALS"] = "AUTH_004";
    // Validation errors
    ErrorCode["INVALID_INPUT"] = "VALID_001";
    ErrorCode["REQUIRED_FIELD"] = "VALID_002";
    ErrorCode["INVALID_FORMAT"] = "VALID_003";
    // Business logic errors
    ErrorCode["RESOURCE_NOT_FOUND"] = "BUS_001";
    ErrorCode["RESOURCE_EXISTS"] = "BUS_002";
    ErrorCode["OPERATION_NOT_ALLOWED"] = "BUS_003";
    // System errors
    ErrorCode["INTERNAL_ERROR"] = "SYS_001";
    ErrorCode["TIMEOUT"] = "SYS_002";
    ErrorCode["RATE_LIMIT"] = "SYS_003";
    // Third-party service errors
    ErrorCode["EXTERNAL_SERVICE"] = "EXT_001";
    ErrorCode["API_LIMIT"] = "EXT_002";
    ErrorCode["API_ERROR"] = "EXT_003";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
