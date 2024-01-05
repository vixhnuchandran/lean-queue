import { QueryResult } from "pg"
import { QueueError, ValidationError } from "./error"
import { QueryManager } from "./QueryManager"
import { QueueOptions, Task } from "./types"

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
  queryManager: QueryManager
): Promise<void> => {
  if (!Number.isInteger(queueId) || queueId <= 0)
    throw new ValidationError(`invalid queue id`)

  if (!(await doesQueueExist(queryManager, queueId)))
    throw new QueueError(`queue id does not exist`)
}

// Validates options
export const validateOptions = (options: QueueOptions) => {
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
  if (expiryTime !== undefined) {
    if (!Number.isInteger(expiryTime)) {
      throw new ValidationError(`invalid 'expiryTime'`)
    } else if (expiryTime <= 0) {
      throw new ValidationError(`invalid 'expiryTime'`)
    }
  }
  return true
}

// Check if queue exists in database.
export const doesQueueExist = async (
  queryManager: QueryManager,
  queueId: number
): Promise<boolean> => {
  const queryStr: string = `
  SELECT EXISTS 
  (SELECT 1 FROM queues WHERE id = $1);
  `

  const response: QueryResult = await queryManager.client.query(queryStr, [
    queueId,
  ])

  if (!response.rows[0].exists) return false

  return true
}

// Validates an array of tasks.
export const validateTasks = (tasks: Task[]) => {
  if (tasks.length === 0) {
    throw new ValidationError(`tasks are empty`)
  }

  tasks.forEach((task, i) => {
    validateObject(task, i)
    validateProperty(task.taskId, `taskId`, i)
    validateParams(task.params, i)
    validatePriority(task.priority, i)
  })
}

const validateObject = (task: Task, index: number) => {
  if (typeof task !== "object") {
    throw new ValidationError(`tasks[${index}]: not an object`)
  }

  if (Object.keys(task).length === 0) {
    throw new ValidationError(`tasks[${index}]: is empty`)
  }
}

const validateProperty = (
  property: any,
  propertyName: string,
  index: number
) => {
  if (property === undefined || property === null) {
    throw new ValidationError(`tasks[${index}]: ${propertyName} missing`)
  }
}

const validateParams = (params: any, index: number) => {
  validateProperty(params, "params", index)

  if (typeof params !== "object") {
    throw new ValidationError(`tasks[${index}]: params must be an object`)
  }

  if (Object.keys(params).length === 0) {
    throw new ValidationError(`tasks[${index}]: params are empty`)
  }
}

const validatePriority = (priority: any, index: number) => {
  if (priority !== undefined) {
    if (!Number.isInteger(priority))
      throw new ValidationError(`tasks[${index}]: priority not an integer`)
    else if (priority <= 0)
      throw new ValidationError(`tasks[${index}]: invalid 'priority'`)
  }
}
