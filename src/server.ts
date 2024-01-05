import app from "./app"
import { logger, wLogger } from "./utils/logger"

const PORT: number = 8484
app.listen(PORT, () => {
  wLogger.info(`Server listening on port ${PORT}`)
})
