import express from "express"
import { Application, Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import * as middlewares from "./middlewares"
import routes from "./routes"

const app: Application = express()

// middlewares
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: "50mb" }))

app.use(middlewares.attachRequestId)

app.use(middlewares.attachQueryManager)

// Routes
app.get("/", (req: Request, res: Response) => {
  return res.sendStatus(StatusCodes.OK)
})
app.use("/", routes)

// error handling middleware
app.use(middlewares.handleErrors)

export default app
