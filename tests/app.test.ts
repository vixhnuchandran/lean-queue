import request from "supertest"
import app from "../src/app"
import deleteEverything from "./deleteAllTables"

beforeAll(async () => {
  await deleteEverything()
})

// Mock test for the "/create-queue" endpoint
describe("Endpoint '/create-queue", () => {
  // Positive Test Case: Create a new queue with valid data
  it("should create a new queue and add tasks", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5003", params: { num1: 44, num2: 98 }, priority: 7 },
          { taskId: "5006", params: { num1: 38, num2: 51 }, priority: 7 },
          { taskId: "5007", params: { num1: 96, num2: 48 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty("queue", 1)
    expect(res.body).toHaveProperty("numTasks", 5)
  })
  // Negative Test Case: Attempt to create a new queue without the 'type' field
  it("should return an error (type is required) when 'type' is missing", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "type is required")
  })
  // Negative Test Case: Attempt to create a new queue with 'type' as an integer
  it("should return an error (type must be a string type) when 'type' is not a string", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: 456,
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "type must be a string type")
  })
  // Negative Test Case: Attempt to create a new queue with 'type' as null
  it("should return an error (type is required) when 'type' is null", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: null,
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "type is required")
  })
  // Negative Test Case: Attempt to create a new queue without 'tasks'
  it("should return an error (tasks are required) when 'tasks' is missing", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",

        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks are required")
  })
  // Negative Test Case: Attempt to create a new queue with empty 'tasks'
  it("should return an error (tasks are empty) when 'tasks' is an empty array", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks are empty")
  })
  // Negative Test Case: Attempt to create a new queue without 'taskId'
  it("should return an error (tasks[1]: taskId missing) when 'taskId' is missing in one of the tasks", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5003", params: { num1: 44, num2: 98 }, priority: 7 },
          { params: { num1: 96, num2: 48 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks[1]: taskId missing")
  })
  // Negative Test Case: Attempt to create a new queue without 'params'
  it("should return an error (params are required) when 'params' is missing in one of the tasks", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5007", priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks[1]: params missing")
  })
  // Negative Test Case: Attempt to create a new queue with empty 'params'
  it("should return an error (params are required) when 'params' is an empty object in one of the tasks", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5007", params: { num1: 96, num2: 48 }, priority: 7 },
          { taskId: "5181", params: {}, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks[1]: params are empty")
  })
  // Negative Test Case: Attempt to create a new queue with invalid "callback"(URL) field
  it("should return an error (invalid 'callback url' format) when 'callback' has an invalid URL format", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "smtp://sample-url.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid 'callback url' format")
  })
  // Negative Test Case: Attempt to create a new queue with invalid "callback"(URL) integer type
  it("should return an error ('callback url' must be a string type) when 'callback' is not a string", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: 123,
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty(
      "error",
      "'callback url' must be a string type"
    )
  })

  // Negative Test Case: Attempt to create a new queue with invalid "expiryTime" field
  it("should return an error (invalid expiryTime) when 'expiryTime' is a negative value", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: -364374574,
          callback: "https://sample-url.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error")
  })
  // Negative Test Case: Attempt to create a new queue with invalid "expiryTime" field
  it("should return an error (invalid 'expiryTime') when 'expiryTime' is not an integer", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: "no-expiry",
          callback: "https://sample-url.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid 'expiryTime'")
  })
  // Negative Test Case: Attempt to create a new queue with invalid 'priority' values
  it("should return an error (tasks[0]: invalid 'priority') when 'priority' is not a positive integer", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: -7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 15000,
          callback: "https://sample-url.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks[0]: invalid 'priority'")
  })
  // Negative Test Case : Attempt to create a new queue with 'priority' not being an integer
  it("should return an error (tasks[1]: priority not an integer) when 'priority' is not an integer", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          {
            taskId: "5181",
            params: { num1: 60, num2: 39 },
            priority: "string",
          },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 15000,
          callback: "https://sample-url.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty(
      "error",
      "tasks[1]: priority not an integer"
    )
  })
})

// Mock test for the "/add-tasks" endpoint
describe("Endpoint '/add-tasks", () => {
  it("should add tasks to the queue", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        queue: 4,
        tasks: [
          { taskId: "5001", params: { num1: 3, num2: 56 }, priority: 7 },
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error")
  })
  // Negative Test Case: Attempt to add Tasks to queue without 'tasks'
  it("should return an error (tasks are required) when 'tasks' is missing", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",

        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks are required")
  })
  // Negative Test Case: Attempt to add Tasks to queue with empty 'tasks'
  it("should return an error (tasks are empty) when 'tasks' is an empty array", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks are empty")
  })
  // Negative Test Case: Attempt to add Tasks to queue without 'taskId'
  it("should return an error (tasks[1]: taskId missing) when 'taskId' is missing in one of the tasks", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5003", params: { num1: 44, num2: 98 }, priority: 7 },
          { params: { num1: 96, num2: 48 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks[1]: taskId missing")
  })
  // Negative Test Case: Attempt to add Tasks to queue without 'params'
  it("should return an error (params are required) when 'params' is missing in one of the tasks", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5007", priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks[1]: params missing")
  })
  // Negative Test Case: Attempt to create a new queue with empty 'params'
  it("should return an error (params are required) when 'params' is an empty object in one of the tasks", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5007", params: { num1: 96, num2: 48 }, priority: 7 },
          { taskId: "5181", params: {}, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "tasks[1]: params are empty")
  })
})

// Mock test for the "/submit-results" endpoint
describe("Endpoint '/submit-results' ", () => {
  it("should return an error (invalid queue)", async () => {
    const res = await request(app)
      .post("/submit-results")
      .send({
        id: 1,
        result: { result: 54 },
        error: { error: null },
      })

    expect(res.statusCode).toEqual(200)
  })

  it("should return an error (invalid queue)", async () => {
    const res = await request(app)
      .post("/submit-results")
      .send({
        id: 1,
        result: {},
        error: { error: "error message here" },
      })

    expect(res.statusCode).toEqual(200)
  })
})

// Mock test for the "/get-results" endpoint
describe("Endpoint '/get-results' ", () => {
  it("should return an error (invalid queue)", async () => {
    const res = await request(app).post("/get-results/nothing")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid queue id")
  })
  it("should return an error (invalid queue)", async () => {
    const res = await request(app).post("/get-results/nothing")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid queue id")
  })
  it("should return an error (invalid queue)", async () => {
    const res = await request(app).post("/get-results/nothing")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid queue id")
  })
})

// Mock test for the "/status" endpoint
describe("Endpoint '/status' ", () => {
  it("should return status of queue", async () => {
    const res = await request(app).post("/status/1")

    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty("totalTasks")
    expect(res.body).toHaveProperty("completedTasks")
    expect(res.body).toHaveProperty("errorTasks")
  })
  it("should return an error (queue id does not exist) when queue integer but not present in database", async () => {
    const res = await request(app).post("/status/12512")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "queue id does not exist")
  })

  it("should return an error (queue id does not exist) when queue is missing", async () => {
    const res = await request(app).post("/status/12512")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "queue id does not exist")
  })

  it("should return an error (invalid queue id) when queue is not an integer", async () => {
    const res = await request(app).post("/status/someQueueId")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid queue id")
  })

  it("should return an error (invalid queue id) when queue is not an positive integer", async () => {
    const res = await request(app).post("/status/-17")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid queue id")
  })
})

// Mock test for the "/delete-queue" endpoint
describe("Endpoint '/delete-queue' ", () => {
  // Negative Test Case:
  it("should return an error (invalid queue) when queue is not an integer", async () => {
    const res = await request(app).post("/delete-queue/nothing")

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error", "invalid queue id")
  })
  // Positive Test Case:
  it("should delete the queue with tasks related to that queue", async () => {
    const res = await request(app).post("/delete-queue/1")

    expect(res.statusCode).toEqual(200)
  })
})
