"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAppErrors = exports.ValidationError = exports.QueueError = exports.QueueErrorCode = exports.ValidationErrorCode = void 0;
const http_status_codes_1 = require("http-status-codes");
exports.ValidationErrorCode = {
    EMPTY_REQUEST_BODY: "VAL-001",
    INVALID_TYPE: "VAL-002",
    INVALID_TYPE_FORMAT: "VAL-003",
    INVALID_QUEUE_ID: "VAL-004",
    QUEUE_NOT_EXIST: "VAL-005",
    INVALID_OPTIONS_OBJECT: "VAL-006",
    INVALID_CALLBACK_TYPE: "VAL-007",
    INVALID_CALLBACK_FORMAT: "VAL-008",
    INVALID_EXPIRY_TIME: "VAL-009",
    EMPTY_TASKS: "VAL-010",
    TASK_NOT_AN_OBJECT: "VAL-011",
    TASK_EMPTY_OBJECT: "VAL-012",
    TASKS_EMPTY_OBJECT: "VAL-013",
    TASK_ID_MISSING: "VAL-014",
    PARAMS_NOT_AN_OBJECT: "VAL-015",
    OPTIONS_NOT_AN_OBJECT: "VAL-016",
    EMPTY_PARAMS: "VAL-017",
    PRIORITY_NOT_AN_INTEGER: "VAL-018",
    INVALID_PRIORITY: "VAL-019",
    MISSING_PROPERTY: "VAL-020",
    MISSING_QUEUE_ID: "VAL-021",
};
exports.QueueErrorCode = {
    QUEUE_NOT_EXIST: "QUE-001",
};
// Custom error class for errors related to queue operations
class QueueError extends Error {
    constructor(message, errorCode) {
        super(message);
        this.name = "QueueError";
        this.message = message;
        this.errorCode = errorCode;
    }
}
exports.QueueError = QueueError;
// Custom error class for errors related to validation errors
class ValidationError extends Error {
    constructor(message, errorCode) {
        super(message);
        this.name = "ValidationError";
        this.message = message;
        this.errorCode = errorCode;
    }
}
exports.ValidationError = ValidationError;
// Handles custom errors (ValidationError, QueueError)
const handleCustomError = (err, req, res) => {
    const requestId = req.requestId;
    if (err instanceof ValidationError || err instanceof QueueError) {
        console.error({
            message: `${err.constructor.name}: ${err.message}`,
            requestId,
        });
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
    console.error({ message: `error: ${err.message}`, requestId });
    return res
        .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: http_status_codes_1.ReasonPhrases.INTERNAL_SERVER_ERROR });
};
// Handles unknown errors
const handleUnknownError = (err, req, res) => {
    const requestId = req.requestId;
    console.error({ message: `error: ${err.message}`, requestId });
    return res
        .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: http_status_codes_1.ReasonPhrases.INTERNAL_SERVER_ERROR });
};
// Main error handling middleware for the application
const handleAppErrors = (err, req, res, next) => {
    if (err instanceof ValidationError || err instanceof QueueError) {
        return handleCustomError(err, req, res);
    }
    else {
        return handleUnknownError(err, req, res);
    }
};
exports.handleAppErrors = handleAppErrors;
