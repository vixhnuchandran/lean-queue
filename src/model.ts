import * as fs from "fs"
import * as path from "path"
import { PoolClient } from "pg"
import { promisify } from "util"
import { pool } from "./database"

const readFileAsync = promisify(fs.readFile)

const createTables = async (): Promise<void> => {
  let client: PoolClient | null = null
  try {
    client = await pool.connect()

    const sqlFilePath: string = path.join(__dirname, "query.sql")

    const sqlQueries: string = await readFileAsync(sqlFilePath, "utf-8")

    await client.query(sqlQueries)
  } catch (err) {
    console.error("Error creating tables", err)
  } finally {
    if (client) {
      client.release()
    }
  }
}

createTables()
