"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/config-loader.ts
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var envPath = path_1.default.resolve(__dirname, '../../.env');
var result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
    throw result.error;
}
console.log('✅ Environment variables loaded successfully from:', envPath);
