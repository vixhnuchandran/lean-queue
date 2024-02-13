"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTasks = exports.doesQueueExist = exports.validateOptions = exports.validateQueueId = exports.validateQueueType = exports.validateRequestBody = void 0;
const error_1 = require("./error");
// Validates request body.
const validateRequestBody = (req) => {
    if (!req.body || Object.keys(req.body).length === 0)
        throw new error_1.ValidationError(`empty request body`, error_1.ValidationErrorCode.EMPTY_REQUEST_BODY);
};
exports.validateRequestBody = validateRequestBody;
// Validates queue type.
const validateQueueType = (type) => {
    if (typeof type !== "string")
        throw new error_1.ValidationError(`'type' must be a string type`, error_1.ValidationErrorCode.EMPTY_REQUEST_BODY);
    if (!/^[a-z0-9-]+$/.test(type))
        throw new error_1.ValidationError(`invalid 'type' format`, error_1.ValidationErrorCode.INVALID_TYPE_FORMAT);
};
exports.validateQueueType = validateQueueType;
// Validates queueId.
const validateQueueId = (queueId, queryManager) => __awaiter(void 0, void 0, void 0, function* () {
    if (!Number.isInteger(queueId) || queueId <= 0)
        throw new error_1.ValidationError(`invalid queue id`, error_1.ValidationErrorCode.INVALID_QUEUE_ID);
    if (!(yield (0, exports.doesQueueExist)(queryManager, queueId)))
        throw new error_1.QueueError(`queue id does not exist`, error_1.QueueErrorCode.QUEUE_NOT_EXIST);
});
exports.validateQueueId = validateQueueId;
// Validates options
const validateOptions = (options) => {
    const urlRegex = /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/;
    const expiryTime = options.expiryTime;
    if (typeof options !== "object") {
        throw new error_1.ValidationError(`'options' must be an object type`, error_1.ValidationErrorCode.OPTIONS_NOT_AN_OBJECT);
    }
    if (typeof options.callback !== "string") {
        throw new error_1.ValidationError(`'callback url' must be a string type`, error_1.ValidationErrorCode.INVALID_CALLBACK_TYPE);
    }
    if (!urlRegex.test(options.callback)) {
        throw new error_1.ValidationError(`invalid 'callback url' format`, error_1.ValidationErrorCode.INVALID_CALLBACK_FORMAT);
    }
    if (expiryTime !== undefined) {
        if (!Number.isInteger(expiryTime)) {
            throw new error_1.ValidationError(`invalid 'expiryTime'`, error_1.ValidationErrorCode.INVALID_EXPIRY_TIME);
        }
        else if (expiryTime <= 0) {
            throw new error_1.ValidationError(`invalid 'expiryTime'`, error_1.ValidationErrorCode.INVALID_EXPIRY_TIME);
        }
    }
    return true;
};
exports.validateOptions = validateOptions;
// Check if queue exists in database.
const doesQueueExist = (queryManager, queueId) => __awaiter(void 0, void 0, void 0, function* () {
    const queryStr = `
  SELECT EXISTS 
  (SELECT 1 FROM queues WHERE id = $1);
  `;
    const response = yield queryManager.client.query(queryStr, [
        queueId,
    ]);
    if (!response.rows[0].exists)
        return false;
    return true;
});
exports.doesQueueExist = doesQueueExist;
// Validates an array of tasks.
const validateTasks = (tasks) => {
    if (tasks.length === 0) {
        throw new error_1.ValidationError(`'tasks' are empty`, error_1.ValidationErrorCode.TASK_EMPTY_OBJECT);
    }
    tasks.forEach((task, i) => {
        validateObject(task, i);
        validateProperty(task.taskId, `taskId`, i);
        validateParams(task.params, i);
        validatePriority(task.priority, i);
    });
};
exports.validateTasks = validateTasks;
const validateObject = (task, index) => {
    if (typeof task !== "object") {
        throw new error_1.ValidationError(`tasks[${index}]: not an object`, error_1.ValidationErrorCode.TASK_NOT_AN_OBJECT);
    }
    if (Object.keys(task).length === 0) {
        throw new error_1.ValidationError(`tasks[${index}]: is empty`, error_1.ValidationErrorCode.EMPTY_TASKS);
    }
};
const validateProperty = (property, propertyName, index) => {
    if (property === undefined || property === null) {
        throw new error_1.ValidationError(`tasks[${index}]: '${propertyName}' missing`, error_1.ValidationErrorCode.MISSING_PROPERTY);
    }
};
const validateParams = (params, index) => {
    validateProperty(params, "params", index);
    if (typeof params !== "object") {
        throw new error_1.ValidationError(`tasks[${index}]: 'params' must be an object`, error_1.ValidationErrorCode.PARAMS_NOT_AN_OBJECT);
    }
    if (Object.keys(params).length === 0) {
        throw new error_1.ValidationError(`tasks[${index}]: 'params' are empty`, error_1.ValidationErrorCode.EMPTY_PARAMS);
    }
};
const validatePriority = (priority, index) => {
    if (priority !== undefined) {
        if (!Number.isInteger(priority))
            throw new error_1.ValidationError(`tasks[${index}]: 'priority' not an integer`, error_1.ValidationErrorCode.PRIORITY_NOT_AN_INTEGER);
        else if (priority <= 0)
            throw new error_1.ValidationError(`tasks[${index}]: invalid 'priority'`, error_1.ValidationErrorCode.INVALID_PRIORITY);
    }
};
