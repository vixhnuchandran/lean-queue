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
exports.checkQueue = exports.taskDetails = exports.queueCounts = exports.queueDetails = exports.queuesDetails = exports.recentQueues = exports.taskStats = exports.deleteAll = exports.deleteQueue = exports.status = exports.completedResults = exports.getResults = exports.submitResults = exports.nextAvailableTask = exports.addTasks = exports.createQueue = void 0;
const http_status_codes_1 = require("http-status-codes");
const validations_1 = require("../validations");
const error_1 = require("../error");
const logger_1 = require("../utils/logger");
let connectedClients = {};
const createQueue = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming client request for 'create-queue'`,
        requestId,
    });
    let requestBody;
    try {
        (0, validations_1.validateRequestBody)(req);
        requestBody = req.body;
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const { type, tasks, options, notes } = requestBody;
        if (!type)
            throw new error_1.ValidationError("type is required", error_1.ValidationErrorCode.MISSING_PROPERTY);
        (0, validations_1.validateQueueType)(type);
        if (!tasks)
            throw new error_1.ValidationError("tasks are required", error_1.ValidationErrorCode.MISSING_PROPERTY);
        (0, validations_1.validateTasks)(tasks);
        if (options)
            (0, validations_1.validateOptions)(options);
    }
    catch (err) {
        logger_1.logger.error({
            message: err.message,
            requestId,
            errorCode: err.errorCode,
        });
        return next(err);
    }
    try {
        const { type, tasks, options, tags, notes } = requestBody;
        const result = yield req.queryManager.createQueueAndAddTasks(type, tasks, tags, options, notes);
        if (result === null || !result.queue || !result.numTasks) {
            return res
                .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: "failed to create queue" });
        }
        const { queue, numTasks } = result;
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            queue,
            numTasks,
        });
    }
    catch (err) {
        return next(err.stack);
    }
});
exports.createQueue = createQueue;
const addTasks = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming client request for 'add-tasks'`,
        requestId,
    });
    let requestBody;
    try {
        (0, validations_1.validateRequestBody)(req);
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        requestBody = req.body;
        const { queue, tasks } = requestBody;
        if (!queue)
            throw new error_1.ValidationError("queue is required", error_1.ValidationErrorCode.MISSING_QUEUE_ID);
        yield (0, validations_1.validateQueueId)(queue, req.queryManager);
        if (!tasks)
            throw new error_1.ValidationError("tasks are required", error_1.ValidationErrorCode.EMPTY_TASKS);
        (0, validations_1.validateTasks)(tasks);
    }
    catch (err) {
        return next(err.stack);
    }
    try {
        const { queue, tasks } = requestBody;
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const numTasks = yield req.queryManager.addTasks(queue, tasks);
        return res.json({ numTasks });
    }
    catch (err) {
        logger_1.logger.error({ message: `add-tasks-error: ${err.message}` });
        return next(err);
    }
});
exports.addTasks = addTasks;
const nextAvailableTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming worker request for 'next-available-task'`,
        requestId,
    });
    let requestBody;
    try {
        (0, validations_1.validateRequestBody)(req);
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        requestBody = req.body;
        const { queue, type, tags, } = requestBody;
        if (!queue && !type && !tags)
            throw new error_1.ValidationError("either queue, type or tags must be specified", error_1.ValidationErrorCode.EMPTY_REQUEST_BODY);
        if (queue)
            yield (0, validations_1.validateQueueId)(queue, req.queryManager);
        if (type)
            (0, validations_1.validateQueueType)(type);
    }
    catch (err) {
        console.log(err.message);
        return next(err);
    }
    let nextAvailableTask;
    try {
        const { queue, type, tags, } = requestBody;
        if (queue)
            nextAvailableTask = yield req.queryManager.getNextAvailableTaskByQueue(queue);
        else if (type)
            nextAvailableTask = yield req.queryManager.getNextAvailableTaskByType(type);
        else if (tags)
            nextAvailableTask = yield req.queryManager.getNextAvailableTaskByTags(tags);
        if (!nextAvailableTask)
            return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).json({
                message: "No available task found",
            });
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            id: nextAvailableTask.id,
            params: nextAvailableTask.params,
            type: nextAvailableTask.queue_type,
        });
    }
    catch (err) {
        return next(err);
    }
});
exports.nextAvailableTask = nextAvailableTask;
const completedResults = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming client request for 'get-completed-results'`,
        requestId,
    });
    let queue;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        if (!req.params.queue) {
            throw new error_1.ValidationError("missing queue", error_1.ValidationErrorCode.MISSING_QUEUE_ID);
        }
        queue = req.params.queue;
        yield (0, validations_1.validateQueueId)(parseInt(queue.toString(), 10), req.queryManager);
        queue = queue.toString();
    }
    catch (err) {
        return next(err);
    }
    try {
        if (!connectedClients[queue]) {
            connectedClients[queue] = [];
        }
        const responsePromise = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            connectedClients[queue].push(resolve);
            try {
                const areAllTasksCompleted = yield ((_a = req.queryManager) === null || _a === void 0 ? void 0 : _a.areAllTasksCompleted(Number(queue)));
                if (areAllTasksCompleted !== undefined) {
                    if (areAllTasksCompleted) {
                        const results = yield ((_b = req.queryManager) === null || _b === void 0 ? void 0 : _b.getResults(queue));
                        resolve(results || null);
                    }
                }
            }
            catch (err) {
                reject(err);
            }
        }));
        const responseData = yield responsePromise;
        if (responseData !== null) {
            res.status(http_status_codes_1.StatusCodes.OK).json(responseData);
        }
        else {
            res.status(http_status_codes_1.StatusCodes.NO_CONTENT);
        }
    }
    catch (err) {
        return next(err);
    }
});
exports.completedResults = completedResults;
const submitResults = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming worker request for 'submit-results'`,
        requestId,
    });
    try {
        const { id, result, error } = req.body;
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const resultData = yield req.queryManager.submitResults(id, result, error);
        if (resultData) {
            const { queue, callbackUrl } = resultData;
            if (yield req.queryManager.areAllTasksCompleted(queue)) {
                logger_1.logger.info("All Tasks Finished");
                const results = yield req.queryManager.getResults(queue);
                if (connectedClients[queue]) {
                    connectedClients[queue].forEach(resolve => {
                        resolve(results);
                    });
                }
                if (results !== null && callbackUrl) {
                    yield req.queryManager.postResults(callbackUrl, results);
                }
            }
        }
        res.sendStatus(200);
    }
    catch (err) {
        return next(err);
    }
});
exports.submitResults = submitResults;
const checkQueue = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming client request for 'check-queue'`,
        requestId,
    });
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        if (!req.body.type && !req.body.id) {
            throw new error_1.ValidationError("Specify either type or id", error_1.ValidationErrorCode.EMPTY_REQUEST_BODY);
        }
    }
    catch (err) {
        return next(err);
    }
    try {
        let response;
        if (req.body.type) {
            const type = req.body.type;
            response = yield req.queryManager.checkQueue("type", type);
        }
        else if (req.body.id) {
            const id = req.body.id;
            response = yield req.queryManager.checkQueue("id", id);
        }
        if (response)
            res.status(200).json(response);
        else
            res.sendStatus(404);
        return;
    }
    catch (err) {
        return next(err);
    }
});
exports.checkQueue = checkQueue;
const getResults = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming client request for 'get-results'`,
        requestId,
    });
    let queue;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        if (!req.params.queue)
            throw new error_1.ValidationError("missing queue", error_1.ValidationErrorCode.MISSING_QUEUE_ID);
        queue = req.params.queue;
        yield (0, validations_1.validateQueueId)(parseInt(queue), req.queryManager);
    }
    catch (err) {
        return next(err);
    }
    try {
        const response = yield req.queryManager.getResults(parseInt(queue));
        if (response && Object.keys(response).length === 0) {
            return res.status(http_status_codes_1.StatusCodes.NO_CONTENT);
        }
        else {
            return res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
    }
    catch (err) {
        return next(err);
    }
});
exports.getResults = getResults;
const status = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({ message: `Incoming client request for 'status'`, requestId });
    let queue;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        if (!req.params.queue)
            throw new error_1.ValidationError("missing queue", error_1.ValidationErrorCode.MISSING_QUEUE_ID);
        queue = req.params.queue;
    }
    catch (err) {
        return next(err);
    }
    try {
        const { total_jobs, completed_count, error_count } = yield req.queryManager.getStatus(parseInt(queue, 10));
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            totalTasks: total_jobs,
            completedTasks: completed_count,
            errorTasks: error_count,
        });
    }
    catch (err) {
        return next(err);
    }
});
exports.status = status;
const deleteQueue = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming client request for 'delete-queue'`,
        requestId,
    });
    let queue;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        if (!req.params.queue)
            throw new error_1.ValidationError("missing queue", error_1.ValidationErrorCode.MISSING_QUEUE_ID);
        queue = req.params.queue;
        yield (0, validations_1.validateQueueId)(parseInt(queue), req.queryManager);
    }
    catch (err) {
        return next(err);
    }
    try {
        yield req.queryManager.deleteQueue(parseInt(queue));
        return res.sendStatus(http_status_codes_1.StatusCodes.OK);
    }
    catch (err) {
        return next(err);
    }
});
exports.deleteQueue = deleteQueue;
const deleteAll = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const requestId = req.requestId;
    logger_1.logger.info({
        message: `Incoming client request for 'delete-everything'`,
        requestId,
    });
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        yield ((_c = req.queryManager) === null || _c === void 0 ? void 0 : _c.deleteEverything());
        return res.sendStatus(http_status_codes_1.StatusCodes.OK);
    }
    catch (err) {
        return next(err);
    }
});
exports.deleteAll = deleteAll;
const taskStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const { timeInterval } = req.query;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const result = yield ((_d = req.queryManager) === null || _d === void 0 ? void 0 : _d.getTasksStats(String(timeInterval)));
        return res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return next(err);
    }
});
exports.taskStats = taskStats;
const recentQueues = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const result = yield ((_e = req.queryManager) === null || _e === void 0 ? void 0 : _e.getRecentQueues());
        return res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return next(err);
    }
});
exports.recentQueues = recentQueues;
const queuesDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const result = yield ((_f = req.queryManager) === null || _f === void 0 ? void 0 : _f.allQueueDetails(req.query));
        return res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return next(err);
    }
});
exports.queuesDetails = queuesDetails;
const queueDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    const { queue } = req.params;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const result = yield ((_g = req.queryManager) === null || _g === void 0 ? void 0 : _g.getQueueDetails(queue, req.query));
        return res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return next(err);
    }
});
exports.queueDetails = queueDetails;
const queueCounts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const result = yield ((_h = req.queryManager) === null || _h === void 0 ? void 0 : _h.queueAndTasksCounts());
        return res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return next(err);
    }
});
exports.queueCounts = queueCounts;
const taskDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    try {
        const queues = req.body;
        if (!req.queryManager) {
            throw new error_1.QueueError("QueryManager is not defined", error_1.QueueErrorCode.QUEUE_NOT_EXIST);
        }
        const result = yield ((_j = req.queryManager) === null || _j === void 0 ? void 0 : _j.TasksDetailsOfQueues(queues));
        return res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        return next(err);
    }
});
exports.taskDetails = taskDetails;
