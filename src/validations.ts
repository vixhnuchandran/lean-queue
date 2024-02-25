import { QueryResult } from "pg"
import {
  QueueError,
  QueueErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "./error"
import { QueryManager } from "./QueryManager"
import { QueueOptions, Task } from "./types"
// Validates request body.
export const validateRequestBody = (req: any): void => {
  if (!req.body || Object.keys(req.body).length === 0)
    throw new ValidationError(
      `empty request body`,
      ValidationErrorCode.EMPTY_REQUEST_BODY
    )
}

// Validates queue type.
export const validateQueueType = (type: string): void => {
  if (typeof type !== "string")
    throw new ValidationError(
      `'type' must be a string type`,
      ValidationErrorCode.EMPTY_REQUEST_BODY
    )

  if (!/^[a-z0-9-]+$/.test(type))
    throw new ValidationError(
      `invalid 'type' format`,
      ValidationErrorCode.INVALID_TYPE_FORMAT
    )
}

// Validates queueId.
export const validateQueueId = async (
  queueId: number,
  queryManager: QueryManager
): Promise<void> => {
  if (!Number.isInteger(queueId) || queueId <= 0)
    throw new ValidationError(
      `invalid queue id`,
      ValidationErrorCode.INVALID_QUEUE_ID
    )

  if (!(await doesQueueExist(queryManager, queueId)))
    throw new QueueError(
      `queue id does not exist`,
      QueueErrorCode.QUEUE_NOT_EXIST
    )
}

// Validates options
export const validateOptions = (options: QueueOptions) => {
  const urlRegex = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/

  const expiryTime: number | undefined = options.expiryTime

  if (typeof options !== "object") {
    throw new ValidationError(
      `'options' must be an object type`,
      ValidationErrorCode.OPTIONS_NOT_AN_OBJECT
    )
  }

  if (typeof options.callback !== "string") {
    throw new ValidationError(
      `'callback url' must be a string type`,
      ValidationErrorCode.INVALID_CALLBACK_TYPE
    )
  }

  if (!urlRegex.test(options.callback)) {
    throw new ValidationError(
      `invalid 'callback url' format`,
      ValidationErrorCode.INVALID_CALLBACK_FORMAT
    )
  }
  if (expiryTime !== undefined) {
    if (!Number.isInteger(expiryTime)) {
      throw new ValidationError(
        `invalid 'expiryTime'`,
        ValidationErrorCode.INVALID_EXPIRY_TIME
      )
    } else if (expiryTime <= 0) {
      throw new ValidationError(
        `invalid 'expiryTime'`,
        ValidationErrorCode.INVALID_EXPIRY_TIME
      )
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
    throw new ValidationError(
      `'tasks' are empty`,
      ValidationErrorCode.TASK_EMPTY_OBJECT
    )
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
    throw new ValidationError(
      `tasks[${index}]: not an object`,
      ValidationErrorCode.TASK_NOT_AN_OBJECT
    )
  }

  if (Object.keys(task).length === 0) {
    throw new ValidationError(
      `tasks[${index}]: is empty`,
      ValidationErrorCode.EMPTY_TASKS
    )
  }
}

const validateProperty = (
  property: any,
  propertyName: string,
  index: number
) => {
  if (property === undefined || property === null) {
    throw new ValidationError(
      `tasks[${index}]: '${propertyName}' missing`,
      ValidationErrorCode.MISSING_PROPERTY
    )
  }
}

const validateParams = (params: any, index: number) => {
  validateProperty(params, "params", index)

  if (typeof params !== "object") {
    throw new ValidationError(
      `tasks[${index}]: 'params' must be an object`,
      ValidationErrorCode.PARAMS_NOT_AN_OBJECT
    )
  }

  if (Object.keys(params).length === 0) {
    throw new ValidationError(
      `tasks[${index}]: 'params' are empty`,
      ValidationErrorCode.EMPTY_PARAMS
    )
  }
}

const validatePriority = (priority: any, index: number) => {
  if (priority !== undefined) {
    if (!Number.isInteger(priority))
      throw new ValidationError(
        `tasks[${index}]: 'priority' not an integer`,
        ValidationErrorCode.PRIORITY_NOT_AN_INTEGER
      )
    else if (priority <= 0)
      throw new ValidationError(
        `tasks[${index}]: invalid 'priority'`,
        ValidationErrorCode.INVALID_PRIORITY
      )
  }
}
