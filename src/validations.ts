import { QueryResult } from "pg"
import { QueueError, ValidationError } from "./error"
import { QueueManager } from "./queueManager"
import { Options, Task } from "./types"

// Validates request body.
export const validateRequestBody = (req: any): void => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new ValidationError(`empty request body`)
}

// Validates queue type.
export const validateQueueType = (type: string): void => {
  if (typeof type !== "string")
    throw new ValidationError(`type must be a string type`)

  if (!/^[a-z0-9-]+$/.test(type))
    throw new ValidationError(`invalid 'type' format`)
}

// Validates queueId.
export const validateQueueId = async (
  queueId: number,
  queueManager: QueueManager
): Promise<void> => {
  if (!Number.isInteger(queueId) || queueId <= 0)
    throw new ValidationError(`invalid queue id`)

  if (!(await doesQueueExist(queueManager, queueId)))
    throw new QueueError(`queue id does not exist`)
}

// Validates options
export const validateOptions = (options: Options) => {
  const urlRegex = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/

  const expiryTime: number | undefined = options.expiryTime

  if (typeof options !== "object") {
    throw new ValidationError(`'options' must be an object type`)
  }

  if (typeof options.callback !== "string") {
    throw new ValidationError(`'callback url' must be a string type`)
  }

  if (!urlRegex.test(options.callback)) {
    throw new ValidationError(`invalid 'callback url' format`)
  }

  if ((expiryTime && !Number.isInteger(expiryTime)) || expiryTime <= 0) {
    throw new ValidationError(`invalid 'expiryTime'`)
  }

  return true
}

// Check if queue exists in database.
export const doesQueueExist = async (
  queueManager: QueueManager,
  queueId: number
): Promise<boolean> => {
  const queryStr: string = `
  SELECT EXISTS 
  (SELECT 1 FROM queues WHERE id = $1);
  `

  const response: QueryResult = await queueManager.client.query(queryStr, [
    queueId,
  ])

  if (!response.rows[0].exists) return false

  return true
}

// Validates an array of tasks.
export const validateTasks = (tasks: [...Task[]]) => {
  tasks.forEach((task, i) => {
    if (typeof task !== "object")
      throw new ValidationError(`tasks[${i}]: not an object`)

    if (Object.keys(task).length === 0)
      throw new ValidationError(`tasks[${i}]: is empty`)

    if (task.taskId === undefined || task.taskId === null)
      throw new ValidationError(`tasks[${i}]: taskId missing`)

    if (typeof task.params !== "object")
      throw new ValidationError(`tasks[${i}]: params must be an object`)

    if (task.params === undefined || task.params === null)
      throw new ValidationError(`tasks[${i}]: params missing or not an object`)

    if (task.priority !== undefined && task.priority !== null) {
      if (!Number.isInteger(task.priority))
        throw new ValidationError(`tasks[${i}]: priority not an integer`)
    }
  })
}
