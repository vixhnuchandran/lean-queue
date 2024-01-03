import request from "supertest"
import app from "../src/app"

// Mock test suite for the "/create-queue" endpoint
describe("Endpoint '/create-queue", () => {
  // Test case: Create a new queue with valid JSON
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
    expect(res.body).toHaveProperty("queue")
    expect(res.body).toHaveProperty("numTasks")
  })

  // Test case: Attempt to create a new queue without the "type" field
  it("should not create a new queue and return an error (type is required)", async () => {
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
    expect(res.body).toHaveProperty("error")
  })

  // Test case: Attempt to create a new queue without the "tasks" field
  it("should not create a new queue and return an error (tasks are required)", async () => {
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
    expect(res.body).toHaveProperty("error")
  })

  // Test case: Attempt to create a new queue without the "tasksId" field
  it("should not create a new queue and return an error (taskId missing)", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5003", params: { num1: 44, num2: 98 }, priority: 7 },
          { params: { num1: 38, num2: 51 }, priority: 7 },
          { taskId: "5007", params: { num1: 96, num2: 48 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sampleurl.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error")
  })

  // Test case: Attempt to create a new queue without the "params" field
  it("should not create a new queue and return an error (params is empty)", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: "addition",
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
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
    expect(res.body).toHaveProperty("error")
  })

  // Test case: Attempt to create a new queue with invalid "callback"(URL) field
  it("should not create a new queue and return an error (invalid callback url format)", async () => {
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
    expect(res.body).toHaveProperty("error")
  })

  // Test case: Attempt to create a new queue with invalid "expiryTime" field
  it("should not create a new queue and return an error (invalid expiryTime)", async () => {
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

  // Test case: Attempt to create a new queue with invalid "type" field
  it("should not create a new queue and return an error (invalid expiryTime)", async () => {
    const res = await request(app)
      .post("/create-queue")
      .send({
        type: 12458,
        tasks: [
          { taskId: "5002", params: { num1: 63, num2: 45 }, priority: 7 },
          { taskId: "5181", params: { num1: 60, num2: 39 }, priority: 7 },
        ],
        tags: ["arithmetic", "dev"],
        options: {
          expiryTime: 150000,
          callback: "https://sample-url.com",
        },
      })

    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty("error")
  })
})
