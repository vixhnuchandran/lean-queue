import app from "./app"
import { logger } from "./utils"

const PORT: number = 8484
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`)
})
