import { Pool, PoolClient } from "pg"
import dotenv from "dotenv"

dotenv.config()

const connectionString: string = process.env.POSTGRES_URL!

if (!connectionString) {
  console.error("POSTGRES_URL is not defined in the environment variables.")
  process.exit(1)
}

const pool: Pool = new Pool({
  connectionString,
  max: 10,
})

pool.on("connect", () => {})

pool.on("error", (err: Error) => {
  console.error("Error connecting to the PostgreSQL database:", err.message)
})

export { pool, PoolClient }
