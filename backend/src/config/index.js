"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var dotenv = require("dotenv");
var path = require("path");
// Explicitly load .env from the project root
var envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
// Validate that essential variables are loaded
var requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
var missingVars = requiredEnvVars.filter(function (varName) { return !process.env[varName]; });
if (missingVars.length > 0) {
    throw new Error("Missing required environment variables: ".concat(missingVars.join(', ')));
}
// Export a structured config object
exports.config = {
    weatherApiKey: process.env.WEATHER_API_KEY || '',
    nrelApiKey: process.env.NREL_API_KEY || '',
    database: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
    server: {
        port: parseInt(process.env.PORT || '3001'),
        environment: process.env.NODE_ENV || 'development',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
};
