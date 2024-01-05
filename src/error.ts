import { Request, Response, NextFunction } from "express"
import { logger, wLogger } from "./utils/logger"
import {
  StatusCodes as httpCodes,
  ReasonPhrases as phrases,
} from "http-status-codes"

// Custom error class for errors related to queue operations
export class QueueError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QueueError"
    this.message = message
  }
}

// Custom error class for errors related to validation errors
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
    this.message = message
  }
}

// Handles custom errors (ValidationError, QueueError)
const handleCustomError = (
  err: Error,
  req: Request,
  res: Response
): Response => {
  if (err instanceof ValidationError || err instanceof QueueError) {
    logger.error(`${err.constructor.name}: ${err.message}`)

    return res.status(httpCodes.BAD_REQUEST).json({ error: err.message })
  }

  logger.error(`error: ${err.message}`)

  return res
    .status(httpCodes.INTERNAL_SERVER_ERROR)
    .json({ error: phrases.INTERNAL_SERVER_ERROR })
}

// Handles unknown errors
const handleUnknownError = (err: Error, req: Request, res: Response) => {
  logger.error(`error: ${err.message}`)

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
