import { Request, Response, NextFunction } from "express"
import { v4 as uuid4 } from "uuid"
import { pool } from "./database"
import { QueueManager } from "./queueManager"
import { handleAppErrors } from "./error"
import { PoolClient } from "pg"

// Extend the Express Request interface to include additional properties
declare module "express" {
  interface Request {
    requestId?: string
    queueManager?: QueueManager
  }
}

// Middleware to attach a unique requestId to each incoming request
const attachRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate a unique requestId using UUIDv4
  req.requestId = uuid4()
  next()
}

// Middleware to attach a QueueManager instance to the request
const attachQueueManager = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const client: PoolClient = await pool.connect()

  try {
    req.queueManager = new QueueManager(client)
    await next()
  } catch (err) {
    console.error("Error in attachQueueManager middleware:", err)
  } finally {
    client.release()
  }
}

// Middleware to handle errors
const handleErrors = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    handleAppErrors(err, req, res, next)
  } catch (innerErr) {
    console.error("Error in handleErrors middleware:", innerErr)
  }
}

export { attachRequestId, attachQueueManager, handleErrors }
