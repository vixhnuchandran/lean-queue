import path from "path"
import { createLogger, transports, format } from "winston"

// Logger using winston
export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "DD-MM-YYYYTHH:mm:ssZ" }),
    format.json(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`
    })
  ),

  transports: [
    new transports.Console(),
    // File transport for app logs
    new transports.File({
      filename: path.join(__dirname, "../..", "logs", "app.log"),
    }),
    // File transport for error logs
    new transports.File({
      filename: path.join(__dirname, "../..", "logs", "error.log"),
      level: "error",
      format: format.printf(
        ({ level, message, timestamp, requestId, errorCode }) => {
          const requestIdText = requestId ? `[requestId: ${requestId}]` : ""
          const errorCodeText = errorCode ? `[code: ${errorCode}]` : ""
          return `${timestamp} [${level.toUpperCase()}] ${requestIdText} ${errorCodeText}:  ${message}`
        }
      ),
    }),
  ],
})
