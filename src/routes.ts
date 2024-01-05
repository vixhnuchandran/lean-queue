import { Request, Response, NextFunction, Router } from "express"
import { StatusCodes as httpCodes } from "http-status-codes"
import { AddTasksType, CreateQueueType } from "./types"
import {
  validateRequestBody,
  validateQueueType,
  validateQueueId,
  validateOptions,
  validateTasks,
} from "./validations"
import { QueueError, ValidationError } from "./error"
import { logger, wLogger } from "./utils/logger"

const routes: Router = Router()

// Route to create a new queue and add tasks
routes.post(
  "/create-queue",
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId
    wLogger.info(
      `Incoming client request for 'create-queue' with requestId ${requestId}`
    )

    let requestBody: any
    try {
      validateRequestBody(req)
      requestBody = req.body
      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      const { type, tasks, options }: CreateQueueType = requestBody

      if (!type) throw new ValidationError("type is required")
      validateQueueType(type)

      if (!tasks) throw new ValidationError("tasks are required")
      validateTasks(tasks)

      if (options) validateOptions(options)
    } catch (err: any) {
      wLogger.error({ message: err.message, requestId })
      return next(err)
    }

    try {
      const { type, tasks, options, tags } = requestBody

      const result: { queue: number; numTasks: number } | null =
        await req.queryManager.createQueueAndAddTasks(
          type,
          tasks,
          tags,
          options
        )

      if (result === null || !result.queue || !result.numTasks) {
        return res
          .status(httpCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "failed to create queue" })
      }

      const { queue, numTasks } = result

      return res.status(httpCodes.OK).json({
        queue,
        numTasks,
      })
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to add tasks to an existing queue
routes.post(
  "/add-tasks",
  async (req: Request, res: Response, next: NextFunction) => {
    wLogger.info(
      `Incoming client request for 'add-tasks' with requestId ${req.requestId}`
    )

    let requestBody: AddTasksType

    try {
      validateRequestBody(req)

      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }

      requestBody = req.body

      const { queue, tasks }: AddTasksType = requestBody

      if (!queue) throw new ValidationError("queue is required")
      await validateQueueId(queue, req.queryManager)

      if (!tasks) throw new ValidationError("tasks are required")
      validateTasks(tasks)
    } catch (err: any) {
      return next(err)
    }

    try {
      const { queue, tasks } = requestBody

      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      const numTasks = await req.queryManager.addTasks(queue, tasks)

      return res.json({ numTasks })
    } catch (err: any) {
      logger.error("add-tasks-error: ", err.message)
      return next(err)
    }
  }
)

// Route to get the next available task
routes.post(
  "/get-next-available-task",
  async (req: Request, res: Response, next: NextFunction) => {
    wLogger.info(
      `Incoming worker request for 'get-next-available-task' with requestId ${req.requestId}`
    )

    let requestBody: { queue: number; type: string; tags: string[] }

    try {
      validateRequestBody(req)

      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      requestBody = req.body

      const {
        queue,
        type,
        tags,
      }: { queue: number; type: string; tags: string[] } = requestBody

      if (!queue && !type && !tags)
        throw new ValidationError(
          "either queue, type or tags must be specified"
        )

      if (queue) await validateQueueId(queue, req.queryManager)

      if (type) validateQueueType(type)
    } catch (err: any) {
      return next(err)
    }

    let nextAvailableTask:
      | { id: number; params: {}; queue_type: string }
      | undefined

    try {
      const {
        queue,
        type,
        tags,
      }: { queue: number; type: string; tags: string[] } = requestBody

      if (queue)
        nextAvailableTask = await req.queryManager.getNextAvailableTaskByQueue(
          queue
        )
      else if (type)
        nextAvailableTask = await req.queryManager.getNextAvailableTaskByType(
          type
        )
      else if (tags)
        nextAvailableTask = await req.queryManager.getNextAvailableTaskByTags(
          tags
        )

      if (!nextAvailableTask)
        return res.status(httpCodes.NO_CONTENT).json({
          message: "No available task found",
        })

      return res.status(httpCodes.OK).json({
        id: nextAvailableTask.id,
        params: nextAvailableTask.params,
        type: nextAvailableTask.queue_type,
      })
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to submit task results
routes.post(
  "/submit-results",
  async (req: Request, res: Response, next: NextFunction) => {
    wLogger.info(
      `Incoming worker request for 'submit-results' with requestId ${req.requestId}`
    )
    try {
      const { id, result, error }: { id: number; result: {}; error: {} } =
        req.body
      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      await req.queryManager.submitResults(id, result, error)

      return res.sendStatus(httpCodes.OK)
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to get results for a specific queue
routes.post(
  "/get-results/:queue",
  async (req: Request, res: Response, next: NextFunction) => {
    wLogger.info(
      `Incoming client request for 'get-results' with requestId ${req.requestId}`
    )

    let queue: number | string

    try {
      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      if (!req.params.queue) throw new ValidationError("missing queue")

      queue = req.params.queue

      await validateQueueId(parseInt(queue), req.queryManager)
    } catch (err: any) {
      return next(err)
    }

    try {
      const response = await req.queryManager.getResults(parseInt(queue))

      if (response && Object.keys(response.results).length === 0) {
        return res
          .status(httpCodes.NO_CONTENT)
          .json({ message: "No completed tasks found" })
      } else {
        return res.status(httpCodes.OK).json(response)
      }
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to get status for a specific queue
routes.post(
  "/status/:queue",
  async (req: Request, res: Response, next: NextFunction) => {
    wLogger.info(
      `Incoming client request for 'status' with requestId ${req.requestId}`
    )
    let queue: string | number

    try {
      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      if (!req.params.queue) throw new ValidationError("missing queue")

      queue = req.params.queue

      await validateQueueId(parseInt(queue), req.queryManager)
    } catch (err: any) {
      return next(err)
    }

    try {
      const { total_jobs, completed_count, error_count } =
        await req.queryManager.getStatus(parseInt(queue, 10))

      return res.status(httpCodes.OK).json({
        totalTasks: total_jobs,
        completedTasks: completed_count,
        errorTasks: error_count,
      })
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to delete a specific queue
routes.post(
  "/delete-queue/:queue",
  async (req: Request, res: Response, next: NextFunction) => {
    wLogger.info(
      `Incoming client request for 'delete-queue' with requestId ${req.requestId}`
    )
    let queue: string | number
    try {
      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      if (!req.params.queue) throw new ValidationError("missing queue")

      queue = req.params.queue

      await validateQueueId(parseInt(queue), req.queryManager)
    } catch (err: any) {
      return next(err)
    }

    try {
      await req.queryManager.deleteQueue(parseInt(queue))

      return res.sendStatus(httpCodes.OK)
    } catch (err: any) {
      return next(err)
    }
  }
)

// Route to delete everything
routes.post(
  "/delete-everything",
  async (req: Request, res: Response, next: NextFunction) => {
    wLogger.info(
      `Incoming client request for 'delete-everything' with requestId ${req.requestId}`
    )
    try {
      if (!req.queryManager) {
        throw new QueueError("QueryManager is not defined")
      }
      await req.queryManager?.deleteEverything()

      return res.sendStatus(httpCodes.OK)
    } catch (err: any) {
      return next(err)
    }
  }
)

export default routes
