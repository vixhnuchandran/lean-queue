import { Request, Response, NextFunction, Router } from "express"
import { StatusCodes as httpCodes } from "http-status-codes"
import { AddTasksType, CreateQueueType, SubmitResultsResponse } from "../types"
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
import { QueryResult } from "pg"

type Resolve<T> = (value: T | PromiseLike<T>) => void

let connectedClients: {
    [queueId: string]: Resolve<any>[]
} = {}

const createQueue = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId
    console.log({
        message: `Incoming client request for 'create-queue'`,
        requestId,
    })

    let requestBody: any
    try {
        validateRequestBody(req)
        requestBody = req.body
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        const { type, tasks, options, notes }: CreateQueueType = requestBody

        if (!type)
            throw new ValidationError(
                "type is required",
                ValidationErrorCode.MISSING_PROPERTY
            )
        validateQueueType(type)

        if (!tasks)
            throw new ValidationError(
                "tasks are required",
                ValidationErrorCode.MISSING_PROPERTY
            )
        validateTasks(tasks)

        if (options) validateOptions(options)
    } catch (err: any) {
        console.error({
            message: err.message,
            requestId,
            errorCode: err.errorCode,
        })
        return next(err)
    }

    try {
        const { type, tasks, options, tags, notes } = requestBody

        const result: { queue: number; numTasks: number } | null =
            await req.queryManager.createQueueAndAddTasks(
                type,
                tasks,
                tags,
                options,
                notes
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
        console.log(err)
        return next(err.stack)
    }
}

const addTasks = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId

    console.log({
        message: `Incoming client request for 'add-tasks'`,
        requestId,
    })
    let requestBody: AddTasksType

    try {
        validateRequestBody(req)

        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }

        requestBody = req.body

        const { queue, tasks }: AddTasksType = requestBody

        if (!queue)
            throw new ValidationError(
                "queue is required",
                ValidationErrorCode.MISSING_QUEUE_ID
            )
        await validateQueueId(queue, req.queryManager)

        if (!tasks)
            throw new ValidationError(
                "tasks are required",
                ValidationErrorCode.EMPTY_TASKS
            )
        validateTasks(tasks)
    } catch (err: any) {
        return next(err.stack)
    }

    try {
        const { queue, tasks } = requestBody

        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        const numTasks = await req.queryManager.addTasks(queue, tasks)

        return res.json({ numTasks })
    } catch (err: any) {
        console.error({ message: `add-tasks-error: ${err.message}` })
        return next(err)
    }
}

const nextAvailableTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = req.requestId

    console.log({
        message: `Incoming worker request for 'next-available-task'`,
        requestId,
    })

    let requestBody: { queue: number; type: string; tags: string[] }

    try {
        validateRequestBody(req)

        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        requestBody = req.body

        const {
            queue,
            type,
            tags,
        }: { queue: number; type: string; tags: string[] } = requestBody

        if (!queue && !type && !tags)
            throw new ValidationError(
                "either queue, type or tags must be specified",
                ValidationErrorCode.EMPTY_REQUEST_BODY
            )

        if (queue) await validateQueueId(queue, req.queryManager)

        if (type) validateQueueType(type)
    } catch (err: any) {
        console.log(err.message)

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
            nextAvailableTask =
                await req.queryManager.getNextAvailableTaskByQueue(queue)
        else if (type)
            nextAvailableTask =
                await req.queryManager.getNextAvailableTaskByType(type)
        else if (tags)
            nextAvailableTask =
                await req.queryManager.getNextAvailableTaskByTags(tags)

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

const completedResults = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = req.requestId
    console.log({
        message: `Incoming client request for 'get-completed-results'`,
        requestId,
    })

    let queue: number | string

    try {
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        if (!req.params.queue) {
            throw new ValidationError(
                "missing queue",
                ValidationErrorCode.MISSING_QUEUE_ID
            )
        }

        queue = req.params.queue

        await validateQueueId(parseInt(queue.toString(), 10), req.queryManager)
        queue = queue.toString()
    } catch (err: any) {
        return next(err)
    }

    try {
        if (!connectedClients[queue]) {
            connectedClients[queue] = []
        }

        const responsePromise = new Promise<{ [taskId: string]: any } | null>(
            async (resolve, reject) => {
                connectedClients[queue].push(resolve)

                try {
                    const areAllTasksCompleted =
                        await req.queryManager?.areAllTasksCompleted(
                            Number(queue)
                        )

                    if (areAllTasksCompleted !== undefined) {
                        if (areAllTasksCompleted) {
                            const results = await req.queryManager?.getResults(
                                queue
                            )
                            resolve(results || null)
                        }
                    }
                } catch (err) {
                    reject(err)
                }
            }
        )

        const responseData = await responsePromise

        if (responseData !== null) {
            res.status(httpCodes.OK).json(responseData)
        } else {
            res.status(httpCodes.NO_CONTENT)
        }
    } catch (err: any) {
        return next(err)
    }
}

const submitResults = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = req.requestId

    console.log({
        message: `Incoming worker request for 'submit-results'`,
        requestId,
    })

    try {
        const { id, result, error }: { id: number; result: {}; error: {} } =
            req.body
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }

        const resultData = await req.queryManager.submitResults(
            id,
            result,
            error
        )

        if (resultData) {
            const { queue, callbackUrl } = resultData

            if (await req.queryManager.areAllTasksCompleted(queue)) {
                console.log("All Tasks Finished")

                const results = await req.queryManager.getResults(queue)

                if (connectedClients[queue]) {
                    connectedClients[queue].forEach(resolve => {
                        resolve(results)
                    })
                }

                if (results !== null && callbackUrl) {
                    await req.queryManager.postResults(callbackUrl, results)
                }
            }
        }
        res.sendStatus(200)
    } catch (err: any) {
        return next(err)
    }
}

const checkQueue = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId
    console.log({
        message: `Incoming client request for 'check-queue'`,
        requestId,
    })

    try {
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }

        if (!req.body.type && !req.body.id) {
            throw new ValidationError(
                "Specify either type or id",
                ValidationErrorCode.EMPTY_REQUEST_BODY
            )
        }
    } catch (err: any) {
        return next(err)
    }

    try {
        let response
        if (req.body.type) {
            const type = req.body.type
            response = await req.queryManager.checkQueue("type", type)
        } else if (req.body.id) {
            const id = req.body.id
            response = await req.queryManager.checkQueue("id", id)
        }

        if (response) res.status(200).json(response)
        else res.sendStatus(404)
        return
    } catch (err: any) {
        return next(err)
    }
}

const getResults = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId
    console.log({
        message: `Incoming client request for 'get-results'`,
        requestId,
    })

    let queue: number | string

    try {
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        if (!req.params.queue)
            throw new ValidationError(
                "missing queue",
                ValidationErrorCode.MISSING_QUEUE_ID
            )

        queue = req.params.queue

        await validateQueueId(parseInt(queue), req.queryManager)
    } catch (err: any) {
        return next(err)
    }

    try {
        const response = await req.queryManager.getResults(parseInt(queue))
        if (response && Object.keys(response).length === 0) {
            return res.status(httpCodes.NO_CONTENT)
        } else {
            return res.status(httpCodes.OK).json(response)
        }
    } catch (err: any) {
        return next(err)
    }
}

//
const status = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId

    console.log({ message: `Incoming client request for 'status'`, requestId })
    let queue: string | number

    try {
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        if (!req.params.queue)
            throw new ValidationError(
                "missing queue",
                ValidationErrorCode.MISSING_QUEUE_ID
            )

        queue = req.params.queue
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

const deleteQueue = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId
    console.log({
        message: `Incoming client request for 'delete-queue'`,
        requestId,
    })
    let queue: string | number
    try {
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        if (!req.params.queue)
            throw new ValidationError(
                "missing queue",
                ValidationErrorCode.MISSING_QUEUE_ID
            )

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

const deleteAll = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId

    console.log({
        message: `Incoming client request for 'delete-everything'`,
        requestId,
    })
    try {
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        await req.queryManager?.deleteEverything()

        return res.sendStatus(httpCodes.OK)
    } catch (err: any) {
        return next(err)
    }
}

const taskStats = async (req: Request, res: Response, next: NextFunction) => {
    const { timeInterval } = req.query

    try {
        if (!req.queryManager) {
            throw new QueueError(
                "QueryManager is not defined",
                QueueErrorCode.QUEUE_NOT_EXIST
            )
        }
        const result = await req.queryManager?.getTasksStats(
            String(timeInterval)
        )

        return res.status(httpCodes.OK).json(result)
    } catch (err: any) {
        return next(err)
    }
}

const recentQueues = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

const queuesDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

const queueDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

const queueCounts = async (req: Request, res: Response, next: NextFunction) => {
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

const taskDetails = async (req: Request, res: Response, next: NextFunction) => {
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

export {
    createQueue,
    addTasks,
    nextAvailableTask,
    submitResults,
    getResults,
    completedResults,
    status,
    deleteQueue,
    deleteAll,
    taskStats,
    recentQueues,
    queuesDetails,
    queueDetails,
    queueCounts,
    taskDetails,
    checkQueue,
}
