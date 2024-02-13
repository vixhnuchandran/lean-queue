"use strict";
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
const attachQueryManager = async (req, res, next) => {
    const client = await database_1.pool.connect();
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
};
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
