import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

const connectionString: string = process.env.POSTGRES_URL!
const pool: Pool = new Pool({
    connectionString,
})

pool.on("connect", () => {})

pool.on("error", err => {})

async function deleteEverything() {
    try {
        await pool.query("TRUNCATE TABLE tasks, queues RESTART IDENTITY")

        console.log("Done")

        return
    } catch (error) {
        console.log(error)
    }
}

export default deleteEverything
