import chalk from "chalk"
import path from "path"
import { createLogger, transports, format } from "winston"

// logger using winston
// levels: {
//   silly: 0,
//   debug: 1,
//   verbose: 2,
//   info: 3,
//   warn: 4,
//   error: 5,
// },
const wLogger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(__dirname, "../..", "logs", "app.log"),
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
    }),
    // error logs
    new transports.File({
      filename: path.join(__dirname, "../..", "logs", "error.log"),
      level: "error",

      format: format.combine(
        format.timestamp(),
        format.json(),
        format.printf(({ level, message, timestamp, requestId }) => {
          return `${timestamp} [${level.toUpperCase()}] [ requestId: ${requestId}]: ${message}`
        })
      ),
    }),
  ],
})

const getCurrentTimestamp = (): string => {
  const now: Date = new Date()
  const timestamp: string = `[${now.toLocaleDateString()}]`
  return timestamp
}
const currentTimestamp = getCurrentTimestamp()

const logger = {
  info: function (message: string, ...args: any): void {
    console.info(
      `${currentTimestamp} ${chalk.blueBright("[INFO]")}: ${message} ${args}`
    )
  },
  log: function (message: string, ...args: any): void {
    console.info(
      `${currentTimestamp} ${chalk.green("[LOG]")}: ${message} ${args}`
    )
  },
  trace: function (message: string, ...args: any): void {
    console.info(
      `${currentTimestamp} ${"chalk.gray([TRACE])"}: ${message} ${args}`
    )
  },
  warn: function (message: string, ...args: any): void {
    console.info(
      `${currentTimestamp} ${chalk.yellow("[WARN]")}: ${message} ${args}`
    )
  },
  error: function (message: string, ...args: any): void {
    console.info(
      `${currentTimestamp} ${chalk.red(["ERROR"])}: ${message} ${args}`
    )
  },
}

export { logger, wLogger }
