import chalk from "chalk"

const getCurrentTimestamp = (): string => {
  const now: Date = new Date()
  const timestamp: string = `[${now.toLocaleDateString()}]`
  return timestamp
}
const currentTimestamp = getCurrentTimestamp()

export const logger = {
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
