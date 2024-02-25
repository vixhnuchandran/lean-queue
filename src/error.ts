import { Request, Response, NextFunction } from "express"
import { logger } from "./utils/logger"
import {
    StatusCodes as httpCodes,
    ReasonPhrases as phrases,
} from "http-status-codes"

export const ValidationErrorCode = {
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
}
export const QueueErrorCode = {
    QUEUE_NOT_EXIST: "QUE-001",
}

// Custom error class for errors related to queue operations
export class QueueError extends Error {
    errorCode: string
    constructor(message: string, errorCode: string) {
        super(message)
        this.name = "QueueError"
        this.message = message
        this.errorCode = errorCode
    }
}

// Custom error class for errors related to validation errors
export class ValidationError extends Error {
    errorCode: string
    constructor(message: string, errorCode: string) {
        super(message)
        this.name = "ValidationError"
        this.message = message
        this.errorCode = errorCode
    }
}

// Handles custom errors (ValidationError, QueueError)
const handleCustomError = (
    err: Error,
    req: Request,
    res: Response
): Response => {
    const requestId = req.requestId

    if (err instanceof ValidationError || err instanceof QueueError) {
        logger.error({
            message: `${err.constructor.name}: ${err.message}`,
            requestId,
        })

        return res.status(httpCodes.BAD_REQUEST).json({ error: err.message })
    }

    logger.error({ message: `error: ${err.message}`, requestId })

    return res
        .status(httpCodes.INTERNAL_SERVER_ERROR)
        .json({ error: phrases.INTERNAL_SERVER_ERROR })
}

// Handles unknown errors
const handleUnknownError = (err: Error, req: Request, res: Response) => {
    const requestId = req.requestId

    logger.error({ message: `error: ${err.message}`, requestId })

    return res
        .status(httpCodes.INTERNAL_SERVER_ERROR)
        .json({ error: phrases.INTERNAL_SERVER_ERROR })
}

// Main error handling middleware for the application
export const handleAppErrors = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ValidationError || err instanceof QueueError) {
        return handleCustomError(err, req, res)
    } else {
        return handleUnknownError(err, req, res)
    }
}
