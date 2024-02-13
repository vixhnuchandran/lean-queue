"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeHandlers = __importStar(require("./handlers"));
const routes = (0, express_1.Router)();
routes.post("/create-queue", routeHandlers.createQueue);
routes.post("/add-tasks", routeHandlers.addTasks);
routes.post("/next-available-task", routeHandlers.nextAvailableTask);
routes.post("/submit-results", routeHandlers.submitResults);
routes.get("/get-results/:queue", routeHandlers.getResults);
routes.post("/check-queue", routeHandlers.checkQueue);
routes.get("/completed-results/:queue", routeHandlers.completedResults);
routes.get("/status/:queue", routeHandlers.status);
routes.post("/delete-queue/:queue", routeHandlers.deleteQueue);
routes.post("/delete-everything", routeHandlers.deleteAll);
routes.get("/tasks-stats", routeHandlers.taskStats);
routes.get("/recent-queues", routeHandlers.recentQueues);
routes.get("/queues-details", routeHandlers.queuesDetails);
routes.get("/get-queue-details/:queue", routeHandlers.queueDetails);
routes.get("/queue-counts", routeHandlers.queueCounts);
routes.get("/get-tasks-details", routeHandlers.taskDetails);
// RESTful API conventions
// routes.post("/queues", routeHandlers.createQueue)
// routes.post("/queues/:id/tasks", routeHandlers.addTasks)
// routes.get("/queues/:id/next-task", routeHandlers.nextAvailableTask)
// routes.post("/queues/:id/tasks/:taskId/results", routeHandlers.submitResults)
// routes.get("/queues/:id/results", routeHandlers.getResults)
// routes.get("/queues/:id/completed-results", routeHandlers.completedResults)
// routes.get("/queues/:id/status", routeHandlers.status)
// routes.delete("/queues/:id", routeHandlers.deleteQueue)
// routes.delete("/queues", routeHandlers.deleteAll)
// routes.get("/tasks/stats", routeHandlers.taskStats)
// routes.get("/queues/recent", routeHandlers.recentQueues)
// routes.get("/queues", routeHandlers.queuesDetails)
// routes.get("/queues/:id", routeHandlers.queueDetails)
// routes.get("/queues/count", routeHandlers.queueCounts)
// routes.get("/tasks/details", routeHandlers.taskDetails)
exports.default = routes;
