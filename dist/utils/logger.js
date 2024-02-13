"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const path_1 = __importDefault(require("path"));
const winston_1 = require("winston");
// Logger using winston
exports.logger = (0, winston_1.createLogger)({
    level: "info",
    format: winston_1.format.combine(winston_1.format.timestamp({ format: "DD-MM-YYYYTHH:mm:ssZ" }), winston_1.format.json(), winston_1.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })),
    transports: [
        new winston_1.transports.Console(),
        // File transport for app logs
        new winston_1.transports.File({
            filename: path_1.default.join(__dirname, "../..", "logs", "app.log"),
        }),
        // File transport for error logs
        new winston_1.transports.File({
            filename: path_1.default.join(__dirname, "../..", "logs", "error.log"),
            level: "error",
            format: winston_1.format.printf(({ level, message, timestamp, requestId, errorCode }) => {
                const requestIdText = requestId ? `[requestId: ${requestId}]` : "";
                const errorCodeText = errorCode ? `[code: ${errorCode}]` : "";
                return `${timestamp} [${level.toUpperCase()}] ${requestIdText} ${errorCodeText}:  ${message}`;
            }),
        }),
    ],
});
