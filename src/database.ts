import { Pool, PoolClient } from "pg"
import * as dotenv from "dotenv"

dotenv.config()

const connectionString: string =
  "postgres://default:yM8quNa7gGBH@ep-dry-glitter-33364785.ap-southeast-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require"

if (!connectionString) {
  console.error("POSTGRES_URL is not defined in the environment variables.")
  process.exit(1)
}

const pool: Pool = new Pool({
  connectionString,
  max: 10,
})

pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database")
})

pool.on("error", (err: Error) => {
  console.error("Error connecting to the PostgreSQL database:", err.message)
})

export { pool, PoolClient }
