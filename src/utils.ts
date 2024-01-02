import chalk from "chalk"

const getCurrentTimestamp = (): string => {
  const now: Date = new Date()
  const timestamp: string = `[${now.toLocaleDateString()}]`
  return timestamp
}
const currentTimestamp = getCurrentTimestamp()

export const logger = {
  info: function (message: string, ...args: any): void {
    console.info(`${currentTimestamp} ${"INFO"}: ${message} ${args}`)
  },
  log: function (message: string, ...args: any): void {
    console.info(`${currentTimestamp} ${"LOG"}: ${message} ${args}`)
  },
  trace: function (message: string, ...args: any): void {
    console.info(`${currentTimestamp} ${"TRACE"}: ${message} ${args}`)
  },
  warn: function (message: string, ...args: any): void {
    console.info(
      `${currentTimestamp} ${chalk.yellow.bold("WARN")}: ${message} ${args}`
    )
  },
  error: function (message: string, ...args: any): void {
    console.info(`${currentTimestamp} ${`ERROR`}: ${message} ${args}`)
  },
}
