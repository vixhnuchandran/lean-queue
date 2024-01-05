import { PoolClient, QueryResult } from "pg"
import format from "pg-format"
import { QueueOptions, Task } from "./types"
import { logger, wLogger } from "./utils/logger"

export class QueryManager {
  client
  constructor(client: PoolClient) {
    this.client = client
  }

  async createQueue(
    type: string,
    tags: string[],
    options: QueueOptions
  ): Promise<number | null> {
    let queue: QueryResult
    let tagsArray: string[] | undefined

    try {
      if (Array.isArray(tags) && tags.length > 0) {
        tagsArray = tags.map((tag: string) => `${tag}`)
      }

      const queryStr: string = `
      INSERT INTO queues (type, tags, options) 
      VALUES ($1, $2, $3)
      RETURNING id;`

      const queryParams = [type, tagsArray, options]

      queue = await this.client.query(queryStr, queryParams)

      return queue.rows[0].id
    } catch (err: any) {
      logger.error(`'createQueue' ${err.message}`)
      return null
    }
  }
  async createQueueAndAddTasks(
    type: string,
    tasks: Task[],
    tags: string[],
    options: QueueOptions
  ): Promise<{ queue: number; numTasks: number } | null> {
    let queue: any
    let numTasks: any

    try {
      queue = await this.createQueue(type, tags, options)

      if (queue) {
        await this.client.query("BEGIN")
        numTasks = await this.addTasks(queue, tasks, options)
      } else {
        logger.error("createQueue operation did not return a valid queue.")
      }
      return { queue, numTasks }
    } catch (err: any) {
      await this.deleteQueue(queue)
      await this.client.query("ROLLBACK")
      logger.error(`error in 'createQueueAndAddTasks': ${err.message}`)
      return null
    }
  }

  async addTasks(
    queue: number,
    tasks: Task[],
    options?: QueueOptions
  ): Promise<number | undefined> {
    try {
      const batchSize: number = 4096
      const totalEntries: any = Object.entries(tasks)
      const totalBatches: number = Math.ceil(totalEntries.length / batchSize)

      let successfulBatches: number = 0

      await this.client.query("BEGIN")
      for (let i = 0; i < totalBatches; i++) {
        const batchStart: number = i * batchSize
        const batchEnd: number = (i + 1) * batchSize
        const batch: [] = totalEntries
          .slice(batchStart, batchEnd)
          .map(([_, data]: any[]) => {
            const taskParams = options
              ? [
                  data.taskId,
                  data.params,
                  data.priority,
                  options.expiryTime,
                  queue,
                ]
              : [data.taskId, data.params, data.priority, queue]
            return taskParams
          })

        try {
          await this.addTasksByBatch(batch)

          await this.client.query("COMMIT")

          successfulBatches++
        } catch (err: any) {
          await this.client.query("ROLLBACK")

          logger.error(`Error adding batch ${i + 1}: ${err.message}`)

          return
        }
      }

      if (successfulBatches === totalBatches) return totalEntries.length
      else return 0
    } catch (err: any) {
      await this.deleteQueue(queue)
      logger.error(`error in 'addTasks': ${err.message}`)
      return
    }
  }
  async addTasksByBatch(batch: any[] | undefined): Promise<void> {
    try {
      if (batch) {
        // add-tasks,

        const queryStr: string = `
          INSERT INTO tasks (task_id, params, priority , ${
            batch[0]?.length === 5 ? "expiry_time, " : ""
          } queue_id) 
          VALUES %L
        `
        await this.client.query(format(queryStr, batch))
      }
    } catch (err: any) {
      logger.error(`error in 'addTasksByBatch': ${err.message}`)
    }
  }

  async deleteQueue(queue: number): Promise<void> {
    try {
      const queryStr: string = `
        DELETE FROM queues
        WHERE id = ${queue};
        `
      await this.client.query(queryStr)
    } catch (err: any) {
      logger.error(`error in 'deleteQueue': ${err.message}`)
    }
  }

  async deleteEverything(): Promise<void> {
    try {
      const queryStr: string = `
      TRUNCATE TABLE tasks, queues RESTART IDENTITY
        `
      await this.client.query(queryStr)
      logger.log("Deleted everything successfully")
    } catch (err: any) {
      logger.error(`error in 'deleteEverything': ${err.message}`)
    }
  }

  async getNextAvailableTaskByQueue(queue: number): Promise<any> {
    let data = null
    try {
      await this.client.query("BEGIN")

      const queryStr = format(
        `
        SELECT tasks.*, queues.type as queue_type
        FROM tasks
        JOIN queues ON tasks.queue_id = queues.id
        WHERE queues.id = %L
          AND (tasks.status = 'available' OR 
               (tasks.status = 'processing' AND tasks.expiry_time < NOW()))
        ORDER BY (tasks.priority)::int DESC
        LIMIT 1;
      `,
        queue
      )

      const result: QueryResult = await this.client.query(queryStr)

      data = result.rows[0]

      if (!data) {
        logger.info("No tasks available right now!")
      } else if (data) {
        const queryStr: string = format(
          `
          UPDATE tasks
          SET status = 'processing', start_time = CURRENT_TIMESTAMP
          WHERE id = %L;
           `,
          data.id
        )

        await this.client.query(queryStr)
      }
      await this.client.query("COMMIT")

      return data
    } catch (err: any) {
      await this.client.query("ROLLBACK")
      logger.error(`Error in getNextTaskByQueue: ${err.message}`)
      return null
    }
  }

  async getNextAvailableTaskByType(type: string) {
    let data = null
    try {
      await this.client.query("BEGIN")

      const queryStr: string = format(
        `
        SELECT tasks.*
        FROM tasks
        JOIN queues ON tasks.queue_id = queues.id
        WHERE queues.type = %L
          AND (tasks.status = 'available' OR 
               (tasks.status = 'processing' AND tasks.expiry_time < NOW()))
        ORDER BY (tasks.priority)::int DESC
        LIMIT 1;`,
        type
      )

      const result: QueryResult = await this.client.query(queryStr)

      data = result.rows[0]
      if (!data) {
        logger.warn("No tasks available right now!")
      } else {
        const queryStr: string = `
          UPDATE tasks SET status = 'processing', start_time =  CURRENT_TIMESTAMP
          WHERE id = ${data.id};
          `
        await this.client.query(queryStr)

        await this.client.query("COMMIT")
      }
      return data
    } catch (err: any) {
      await this.client.query("ROLLBACK")

      logger.error(`Error in getNextTaskByType: ${err.message}`)
      return null
    }
  }

  async getNextAvailableTaskByTags(tags: string[]) {
    let data = null
    try {
      let tagsArray: string[] = Array.isArray(tags) ? tags : JSON.parse(tags)
      const tagsCondition = tagsArray.map(tag => `${tag}`)

      await this.client.query("BEGIN")

      const queryStr: string = format(
        `
          SELECT tasks.*, queues.type as queue_type
          FROM tasks
          JOIN queues ON tasks.queue_id = queues.id
          WHERE queues.tags @> ARRAY[%L]::VARCHAR(255)[]
            AND (tasks.status = 'available' OR
                 (tasks.status = 'processing' AND tasks.expiry_time < NOW()))
          ORDER BY (tasks.priority)::int DESC
          LIMIT 1;
        `,
        tagsCondition
      )

      const result: QueryResult = await this.client.query(queryStr)

      data = result.rows[0]
      if (!data) {
        logger.info("No tasks available right now!")
      } else if (data) {
        const queryStr: string = `
          UPDATE tasks SET status = 'processing', start_time =  CURRENT_TIMESTAMP
          WHERE id = ${data.id};
          `
        await this.client.query(queryStr)

        await this.client.query("COMMIT")
      }
      return data
    } catch (err: any) {
      await this.client.query("ROLLBACK")

      logger.error(`Error in getNextTaskByTags: ${err.message}`)

      return null
    }
  }

  async submitResults(id: number, result: {}, error: {}): Promise<void> {
    try {
      const resultObj: {} = error ? { error } : { result }
      const queryStr: string = `
          UPDATE tasks 
          SET 
            status = CASE
              WHEN $1::text IS NOT NULL THEN 'error'::task_status
              ELSE 'completed'::task_status
            END,
            end_time = NOW(),
            result = $2::jsonb
          FROM queues
          WHERE tasks.id = $3 AND queues.id = tasks.queue_id
          RETURNING tasks.queue_id, queues.options->>'callback' AS callback_url;
        `

      await this.client.query("BEGIN")

      const response: QueryResult = await this.client.query(queryStr, [
        error,
        JSON.stringify(resultObj),
        id,
      ])

      const queue: number = response.rows[0].queue_id

      const callbackUrl: string = response.rows[0].callback_url

      if (await this.areAllTasksCompleted(queue)) {
        logger.log("All Tasks Finished")

        const results = await this.getResults(queue)

        if (results !== null && callbackUrl) {
          await this.postResults(callbackUrl, results)
        }
      }

      await this.client.query("COMMIT")
    } catch (err: any) {
      await this.client.query("ROLLBACK")

      logger.error(`error in 'submitResults' : ${err.message}`)
    }
  }

  async getStatus(queue: number) {
    try {
      const queryStr: string = `
        SELECT 
            COUNT(task_id) AS total_jobs,
            SUM(CASE WHEN status = 'completed' OR status = 'error' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS error_count
        FROM tasks
        WHERE queue_id = ${queue} ;
         `

      const response: QueryResult = await this.client.query(queryStr)

      return response.rows[0]
    } catch (err: any) {
      logger.error(`error in 'getStatus': ${err.message}`)

      return null
    }
  }

  async getResults(queue: number): Promise<{ [taskId: string]: any } | null> {
    let results: any = {}

    try {
      const queryStr = `
        SELECT task_id, result
        FROM tasks
        WHERE status IN ('completed', 'error') 
          AND queue_id = ${queue};
         `
      const response = await this.client.query(queryStr)

      response.rows.forEach(row => {
        results[row.task_id] = row.result
      })
    } catch (err: any) {
      logger.error(`error in 'getResults': ${err.message}`)
    }
    return { results }
  }

  async postResults(url: string, results: {}): Promise<void> {
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(results),
      })
    } catch (err: any) {
      logger.error(`error in 'postResults': ${err.message}`)
    }
  }
  async areAllTasksCompleted(queue: number): Promise<boolean> {
    let areCompleted: boolean = false

    let totalTasks: QueryResult, completedTasks: QueryResult

    if (queue) {
      totalTasks = await this.totalTaskCountInQueue(queue)

      completedTasks = await this.completedTaskCountInQueue(queue)

      if (totalTasks.rows[0].count === completedTasks.rows[0].count) {
        areCompleted = true
      }
    }

    return areCompleted
  }

  async totalTaskCountInQueue(queue: number): Promise<QueryResult> {
    const queryStr: string = `
        SELECT COUNT(*) FROM tasks 
        WHERE queue_id = ${queue}
        `
    const response: QueryResult = await this.client.query(queryStr)

    return response
  }

  async completedTaskCountInQueue(queue: number): Promise<QueryResult> {
    const queryStr: string = `
        SELECT COUNT(*) FROM tasks 
        WHERE queue_id = ${queue} 
          AND status IN ('completed', 'error')
        `
    const response: QueryResult = await this.client.query(queryStr)

    return response
  }
}
