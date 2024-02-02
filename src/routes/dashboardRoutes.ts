import { Request, Response, NextFunction, Router, query } from "express"
import { StatusCodes as httpCodes } from "http-status-codes"
import { AddTasksType, CreateQueueType } from "../types"
import {
  validateRequestBody,
  validateQueueType,
  validateQueueId,
  validateOptions,
  validateTasks,
} from "../validations"
import {
  QueueError,
  QueueErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error"
import { logger } from "../utils/logger"

const routes: Router = Router()

routes.get(
  "/tasks-stats",
  async (req: Request, res: Response, next: NextFunction) => {
    const { timeInterval } = req.query

    try {
      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.getTasksStats(String(timeInterval))

      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

routes.get(
  "/recent-queues",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.getRecentQueues()

      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

routes.get(
  "/queues-details",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.allQueueDetails(req.query)

      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

routes.get(
  "/get-queue-details/:queue",
  async (req: Request, res: Response, next: NextFunction) => {
    const { queue } = req.params
    try {
      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.getQueueDetails(queue, req.query)

      return res.status(httpCodes.OK).json(result)
    } catch (err) {
      return next(err)
    }
  }
)

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

//
///
//
//
//
//
//
///
//
//
//
///
//
//
// Route to get total queues counts (& incompleted, ongoing)
routes.get(
  "/queue-counts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.queueAndTasksCounts()

      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

routes.get(
  "/completed-queues",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.completedQueues()

      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to get tasks details of queues
routes.post(
  "/get-tasks-details",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queues: number[] = req.body

      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.TasksDetailsOfQueues(queues)

      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to get tasks details of a single queue
routes.post(
  "/queue-details/:queue",
  async (req: Request, res: Response, next: NextFunction) => {
    const { viewAll, status, sortBy, sortOrder } = req.query
    try {
      const queueId: string = req.params.queue

      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }

      const result = await req.queryManager?.TaskDetailsOfQueue(
        Number(queueId),
        req.query
      )
      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

routes.post(
  "/tasks-completed-within-an-hour",
  async (req: Request, res: Response, next: NextFunction) => {
    const { viewAll, status } = req.query

    try {
      const queueId: string = req.params.queue

      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.TasksCompletedWithinAnHour()
      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

routes.post(
  "/tasks-completed-within-an-hour",
  async (req: Request, res: Response, next: NextFunction) => {
    const { viewAll, status } = req.query

    try {
      const queueId: string = req.params.queue

      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.TasksCompletedWithinAnHour()
      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

routes.post(
  "/get-params-and-result/:taskId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params

    try {
      const queueId: string = req.params.queue

      if (!req.queryManager) {
        throw new QueueError(
          "QueryManager is not defined",
          QueueErrorCode.QUEUE_NOT_EXIST
        )
      }
      const result = await req.queryManager?.getParamAndResult(taskId)
      return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
      return next(err)
    }
  }
)

export default routes
