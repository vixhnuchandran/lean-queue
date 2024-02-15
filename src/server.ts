import app from "./app"
// import { logger } from "./utils/logger"
import fs from "fs"
import https from "https"
import path from "path"
try {
  const keyPath = path.resolve(__dirname, "private.key")
  const key = fs.readFileSync(keyPath)

  const certPath = path.resolve(__dirname, "certificate.crt")
  const cert = fs.readFileSync(certPath)

  console.log(key)

  const cred = {
    key,
    cert,
  }

  const httpsServer = https.createServer(cred, app)

  const PORT = 8484

  httpsServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
} catch (error) {
  console.error("Error reading certificate files:", error)
}
