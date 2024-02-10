import { Router } from "express"
import * as routeHandlers from "./handlers"

const routes: Router = Router()

routes.post("/create-queue", routeHandlers.createQueue)

routes.post("/add-tasks", routeHandlers.addTasks)

routes.post("/next-available-task", routeHandlers.nextAvailableTask)

routes.post("/submit-results", routeHandlers.submitResults)

routes.get("/get-results/:queue", routeHandlers.getResults)

routes.post("/check-queue", routeHandlers.checkQueue)

routes.get("/completed-results/:queue", routeHandlers.completedResults)

routes.get("/status/:queue", routeHandlers.status)

routes.post("/delete-queue/:queue", routeHandlers.deleteQueue)

routes.post("/delete-everything", routeHandlers.deleteAll)

routes.get("/tasks-stats", routeHandlers.taskStats)

routes.get("/recent-queues", routeHandlers.recentQueues)

routes.get("/queues-details", routeHandlers.queuesDetails)

routes.get("/get-queue-details/:queue", routeHandlers.queueDetails)

routes.get("/queue-counts", routeHandlers.queueCounts)

routes.get("/get-tasks-details", routeHandlers.taskDetails)

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

export default routes
