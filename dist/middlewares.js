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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleErrors = exports.attachQueryManager = exports.attachRequestId = void 0;
const uuid_1 = require("uuid");
const database_1 = require("./database");
const QueryManager_1 = require("./QueryManager");
const error_1 = require("./error");
// Middleware to attach a unique requestId to each incoming request
const attachRequestId = (req, res, next) => {
    // Generate a unique requestId using UUIDv4
    req.requestId = (0, uuid_1.v4)();
    next();
};
exports.attachRequestId = attachRequestId;
// Middleware to attach a QueryManager instance to the request
const attachQueryManager = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield database_1.pool.connect();
    try {
        req.queryManager = new QueryManager_1.QueryManager(client);
        next();
    }
    catch (err) {
        console.error("Error in attachQueryManager middleware:", err);
    }
    finally {
        client.release();
    }
});
exports.attachQueryManager = attachQueryManager;
// Middleware to handle errors
const handleErrors = (err, req, res, next) => {
    try {
        (0, error_1.handleAppErrors)(err, req, res, next);
    }
    catch (innerErr) {
        console.error("Error in handleErrors middleware:", innerErr);
    }
};
exports.handleErrors = handleErrors;
