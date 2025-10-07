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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var dotenv_1 = __importDefault(require("dotenv"));
var models_1 = require("./models");
// Import only existing route files
var survey_routes_1 = __importDefault(require("./routes/survey.routes"));
var asset_routes_1 = __importDefault(require("./routes/asset.routes"));
var whatsapp_routes_1 = __importDefault(require("./routes/whatsapp.routes"));
// Global error handlers - must be at the top level
process.on('uncaughtException', function (error) {
    console.error('\n🚨 UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', error);
    // Attempt a graceful shutdown
    process.exit(1);
});
process.on('unhandledRejection', function (reason, promise) {
    console.error('\n🚨 UNHANDLED REJECTION! Shutting down...');
    console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
    // Close server & exit process
    if (server) {
        server.close(function () {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
var server; // Will hold the server instance
dotenv_1.default.config();
var app = (0, express_1.default)();
var port = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes - only use routes that have corresponding files
app.use('/api/survey', survey_routes_1.default);
app.use('/api/assets', asset_routes_1.default);
app.use('/api/whatsapp', whatsapp_routes_1.default);
// Health check
app.get('/health', function (req, res) {
    res.json({ status: 'healthy' });
});
// Error handling middleware
app.use(function (err, req, res, next) {
    console.error('Error middleware:', err.stack);
    var status = err.status || 500;
    res.status(status).json(__assign({ message: err.message || 'Something went wrong!' }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
});
// Start server
var startServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    var envVars, dbTimeout, dbVersion, version, dbError_1, portNumber, server_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                // Enhanced logging
                console.log('🚀 Starting server initialization...');
                console.log("\uD83C\uDF0D Environment: ".concat(process.env.NODE_ENV || 'development'));
                console.log("\uD83D\uDD0C Database config: ".concat(JSON.stringify({
                    host: process.env.DB_HOST || 'localhost',
                    port: process.env.DB_PORT || '5432',
                    database: process.env.DB_NAME || 'dream_tool',
                    username: process.env.DB_USER || 'postgres',
                    password: process.env.DB_PASSWORD ? '***' : 'not set'
                }, null, 2)));
                // Log Node.js and OS information
                console.log('\n📊 System Information:');
                console.log("- Node.js version: ".concat(process.version));
                console.log("- Platform: ".concat(process.platform, " ").concat(process.arch));
                console.log("- Memory: ".concat(Math.round(process.memoryUsage().heapUsed / 1024 / 1024), "MB used"));
                // Log loaded environment variables (safely)
                console.log('\n🔧 Environment Variables:');
                envVars = {
                    NODE_ENV: process.env.NODE_ENV,
                    PORT: process.env.PORT,
                    DB_HOST: process.env.DB_HOST,
                    DB_PORT: process.env.DB_PORT,
                    DB_NAME: process.env.DB_NAME,
                    DB_USER: process.env.DB_USER,
                    JWT_SECRET: process.env.JWT_SECRET ? '***' : 'not set',
                };
                console.table(envVars);
                // Test database connection first
                console.log('\n🔌 Testing database connection...');
                dbTimeout = setTimeout(function () {
                    console.error('❌ Database connection timed out after 10 seconds');
                    process.exit(1);
                }, 10000);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                console.log('🔌 Attempting to authenticate with database...');
                return [4 /*yield*/, models_1.sequelize.authenticate()];
            case 2:
                _a.sent();
                clearTimeout(dbTimeout);
                console.log('✅ Database connection established successfully');
                return [4 /*yield*/, models_1.sequelize.query('SELECT version();')];
            case 3:
                dbVersion = (_a.sent())[0];
                version = dbVersion && dbVersion[0] ? dbVersion[0].version : 'unknown';
                console.log("\uD83D\uDCCA Database version: ".concat(version));
                return [3 /*break*/, 5];
            case 4:
                dbError_1 = _a.sent();
                clearTimeout(dbTimeout);
                console.error('❌ Database connection failed:');
                console.error(dbError_1);
                console.error('\n💡 Troubleshooting tips:');
                console.error('- Verify PostgreSQL is running and accessible');
                console.error('- Check database credentials in .env file');
                console.error('- Ensure the database exists and user has permissions');
                console.error('- Check if the port is not blocked by a firewall');
                process.exit(1);
                return [3 /*break*/, 5];
            case 5:
                // Start HTTP server
                console.log('🚀 Starting HTTP server...');
                portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
                server_1 = app.listen(portNumber, '0.0.0.0', function () {
                    console.log("\u2705 Server is running on http://localhost:".concat(port));
                    console.log('🛣️  Available routes:');
                    console.log("  - GET  /health");
                    console.log("  - GET  /api/survey");
                    console.log("  - GET  /api/techno-economic");
                    console.log("  - GET  /api/assets");
                    console.log("  - POST /api/auth/login");
                });
                // Enhanced server error handling
                server_1.on('error', function (error) {
                    console.error('❌ Server error:', error);
                    if (error.syscall !== 'listen') {
                        console.error('Non-listen error:', error);
                        throw error;
                    }
                    switch (error.code) {
                        case 'EACCES':
                            console.error("Port ".concat(port, " requires elevated privileges"));
                            process.exit(1);
                            break;
                        case 'EADDRINUSE':
                            console.error("Port ".concat(port, " is already in use"));
                            console.log('Try running: netstat -ano | findstr :3001');
                            console.log('Then: taskkill /PID <PID> /F');
                            process.exit(1);
                            break;
                        default:
                            console.error('Unknown server error:', error);
                            throw error;
                    }
                });
                // Handle unhandled promise rejections
                process.on('unhandledRejection', function (reason, promise) {
                    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
                    // Consider restarting the server or performing cleanup
                });
                // Handle uncaught exceptions
                process.on('uncaughtException', function (error) {
                    console.error('Uncaught Exception:', error);
                    // Consider restarting the server or performing cleanup
                    process.exit(1);
                });
                // Handle process termination
                process.on('SIGTERM', function () {
                    console.log('SIGTERM received. Shutting down gracefully...');
                    server_1.close(function () {
                        console.log('Server closed');
                        process.exit(0);
                    });
                });
                return [2 /*return*/, server_1];
            case 6:
                error_1 = _a.sent();
                console.error('❌ Server startup failed with error:');
                console.error(error_1);
                process.exit(1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
startServer();
