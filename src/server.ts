import app from "./app"
import { logger } from "./utils/logger"

const PORT: number = 8484
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
