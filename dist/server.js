"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
// import { logger } from "./utils/logger"
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
try {
    const keyPath = path_1.default.resolve(__dirname, "../certificates", "private.key");
    const key = fs_1.default.readFileSync(keyPath);
    const certPath = path_1.default.resolve(__dirname, "../certificates", "certificate.crt");
    const cert = fs_1.default.readFileSync(certPath);
    console.log(key);
    const cred = {
        key,
        cert,
    };
    const httpsServer = https_1.default.createServer(cred, app_1.default);
    const PORT = 8484;
    httpsServer.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}
catch (error) {
    console.error("Error reading certificate files:", error);
}
