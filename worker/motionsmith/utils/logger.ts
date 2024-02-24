import winston from "winston"
import path from "path"

// Custom format function to include task ID in every log entry
const addTaskId = winston.format((info, opts) => {
    if (opts.taskId) {
        info.taskId = opts.taskId
    }
    return info
})

// configure winston
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        addTaskId({ taskId: "" }),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                // winston.format.colorize(),
                winston.format.json()
            ),
        }),
        new winston.transports.File({
            filename: path.join("logs", "error.log"),
            level: "error",
            format: winston.format.combine(
                addTaskId({ taskId: "" }),
                // winston.format.uncolorize(),
                winston.format.json()
            ),
        }),
        new winston.transports.File({
            filename: path.join("logs", "combined.log"),
            format: winston.format.combine(
                addTaskId({ taskId: "" }),
                // winston.format.uncolorize(),
                winston.format.json()
            ),
        }),
    ],
})

export default logger
