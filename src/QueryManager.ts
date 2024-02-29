import { PoolClient, QueryResult } from "pg"
import format from "pg-format"
import { QueueOptions, Task } from "./types"
import { logger } from "./utils/logger"
import { SubmitResultsResponse } from "./types"

export class QueryManager {
    client
    constructor(client: PoolClient) {
        this.client = client
    }

    async getExpiryTime(queue: number) {
        const queryStr: string = `
    SELECT options->>'expiryTime'
    FROM queues
    WHERE id = $1;
    `
        const result: QueryResult<any> = await this.client.query(queryStr, [
            queue,
        ])
        return parseInt(result.rows[0]["?column?"])
    }

    async createQueue(
        type: string,
        tags: string[],
        options: QueueOptions,
        notes: string
    ): Promise<number | null> {
        let queue: QueryResult
        let tagsArray: string[] | undefined

        try {
            if (Array.isArray(tags) && tags.length > 0) {
                tagsArray = tags.map((tag: string) => `${tag}`)
            }

            const queryStr: string = `
      INSERT INTO queues (type, tags, options, info, notes) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;`

            const info: {} = {
                created_at: Date.now(),
                updated_at: Date.now(),
            }
            const queryParams = [type, tagsArray, options, info, notes],
                queue = await this.client.query(queryStr, queryParams)

            return queue.rows[0].id
        } catch (err: any) {
            logger.error({ message: `'createQueue' ${err.message}` })
            return null
        }
    }

    async createQueueAndAddTasks(
        type: string,
        tasks: Task[],
        tags: string[],
        options: QueueOptions,
        notes: string
    ): Promise<{ queue: number; numTasks: number } | null> {
        let queue: any
        let numTasks: any

        try {
            await this.client.query("BEGIN")

            queue = await this.createQueue(type, tags, options, notes)

            if (queue) {
                numTasks = await this.addTasks(queue, tasks, options)
            } else {
                console.error({
                    message:
                        "createQueue operation did not return a valid queue.",
                })
            }
            return { queue, numTasks }
        } catch (err: any) {
            await this.deleteQueue(queue)
            await this.client.query("ROLLBACK")
            console.error({
                message: `error in 'createQueueAndAddTasks': ${err.message}`,
            })
            return null
        }
    }

    async addTasks(
        queue: number,
        tasks: Task[],
        options?: QueueOptions
    ): Promise<number | null> {
        try {
            const batchSize: number = 4096
            const totalEntries: any = Object.entries(tasks)
            const totalBatches: number = Math.ceil(
                totalEntries.length / batchSize
            )

            let successfulBatches: number = 0

            const currentTime: Date = new Date()
            let expiryTime: Date

            if (options && options.expiryTime !== undefined) {
                expiryTime = new Date(
                    currentTime.getTime() + options.expiryTime
                )
            } else {
                const expiryTimeFromQueue =
                    (await this.getExpiryTime(queue)) || 2 * 60 * 1000 // 2min default
                expiryTime = new Date(
                    currentTime.getTime() + expiryTimeFromQueue
                )
            }

            await this.client.query("BEGIN")

            for (let i = 0; i < totalBatches; i++) {
                const batchStart: number = i * batchSize
                const batchEnd: number = (i + 1) * batchSize
                const batch: [] = totalEntries
                    .slice(batchStart, batchEnd)
                    .map(([_, data]: any[]) => {
                        return [
                            data.taskId,
                            data.params,
                            data.priority ?? parseInt("5"),
                            expiryTime,
                            queue,
                            { added_at: Date.now() },
                        ]
                    })

                try {
                    const response = await this.addTasksByBatch(batch)
                    await this.client.query("COMMIT")

                    if (!response) return null

                    successfulBatches++
                } catch (err: any) {
                    await this.client.query("ROLLBACK")

                    console.error({
                        message: `Error adding batch ${i + 1}: ${err.message}`,
                    })

                    return null
                }
            }

            if (successfulBatches === totalBatches) return totalEntries.length
            else return null
        } catch (err: any) {
            await this.deleteQueue(queue)
            logger.error({ message: `Error in 'addTasks': ${err.message}` })
            return null
        }
    }

    async addTasksByBatch(batch: any[] | undefined): Promise<boolean> {
        try {
            if (batch) {
                const queryStr = `
                INSERT INTO tasks (task_id, params, priority, expiry_time, queue_id, info) 
                VALUES %L
              `
                await this.client.query(format(queryStr, batch))
            }
            return true
        } catch (err: any) {
            console.error({
                message: `error in 'addTasksByBatch': ${err.message}`,
            })
            return false
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
            logger.error({ message: `error in 'deleteQueue': ${err.message}` })
        }
    }

    async deleteEverything(): Promise<void> {
        try {
            const queryStr: string = `
      TRUNCATE TABLE tasks, queues RESTART IDENTITY
        `
            await this.client.query(queryStr)
            console.log("Deleted everything successfully")
        } catch (err: any) {
            console.error({
                message: `error in 'deleteEverything': ${err.message}`,
            })
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
                console.log("No tasks available right now!")
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
            console.error({
                message: `Error in getNextTaskByQueue: ${err.message}`,
            })
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
                console.log("No tasks available right now!")
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

            console.error({
                message: `Error in getNextTaskByType: ${err.message}`,
            })
            return null
        }
    }

    async getNextAvailableTaskByTags(tags: string[]) {
        let data = null
        try {
            let tagsArray: string[] = Array.isArray(tags)
                ? tags
                : JSON.parse(tags)
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
                console.log("No tasks available right now!")
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

            console.error({
                message: `Error in getNextTaskByTags: ${err.message}`,
            })

            return null
        }
    }

    async submitResults(
        id: number,
        result: {},
        error: {},
        worker: {}
    ): Promise<SubmitResultsResponse | null> {
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
            const queryStr2: string = `
        UPDATE queues
        SET info = jsonb_set(info, '{updated_at}', to_jsonb(EXTRACT(EPOCH FROM NOW()) * 1000)::text::jsonb, true)
        WHERE id = $1;`

            const queryStr3: string = `
        UPDATE tasks
        SET info = jsonb_set(
                    info,
                    '{worker}',
                    $1,
                    true
                );
        `
            await this.client.query("BEGIN")

            const response: QueryResult = await this.client.query(queryStr, [
                error,
                JSON.stringify(resultObj),
                id,
            ])

            const queue: number = response.rows[0].queue_id

            await this.client.query(queryStr2, [queue])
            await this.client.query(queryStr3, [worker])

            const callbackUrl: string = response.rows[0].callback_url

            await this.client.query("COMMIT")
            return { queue, callbackUrl }
        } catch (err: any) {
            await this.client.query("ROLLBACK")
            console.error({
                message: `error in 'submitResults' : ${err.message}`,
            })
            return null
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
            logger.error({ message: `error in 'getStatus': ${err.message}` })
        }
    }

    async checkQueue(
        field: string,
        value: string | number
    ): Promise<{ id: number; type: string | null } | null> {
        try {
            const queryStr = `
        SELECT id, type
        FROM queues
        WHERE ${field} = $1;
      `
            const response = await this.client.query(queryStr, [value])
            const queueData = response.rows[0] || null
            return queueData
        } catch (err: any) {
            logger.error({ message: `Error in 'checkQueue': ${err.message}` })
            return null
        }
    }

    async getResults(
        queue: number | string
    ): Promise<{ [taskId: string]: any } | null> {
        let results: { [taskId: string]: any } = {}
        try {
            const queryStr = `
        SELECT task_id, result
        FROM tasks
        WHERE status IN ('completed', 'error') 
          AND queue_id = ${queue};
      `
            const response = await this.client.query(queryStr)

            if (response.rows.length === 0) {
                return null
            }

            response.rows.forEach(row => {
                results[row.task_id] = row.result
            })
        } catch (err: any) {
            logger.error({ message: `error in 'getResults': ${err.message}` })
        }
        return results
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
            logger.error({ message: `error in 'postResults': ${err.message}` })
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
        try {
            const queryStr: string = `
        SELECT COUNT(*) FROM tasks 
        WHERE queue_id = ${queue}
      `

            const response: QueryResult = await this.client.query(queryStr)

            return response
        } catch (error: any) {
            console.error("Error querying the database:", error.message)
            throw error
        }
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

    //---------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------
    //----------------------------   Dashboard data functions  ----------------------------
    //----------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------

    /**
     * Returns the statistics of the tasks in the system.
     * @returns An object containing the total number of tasks,
     *  the number of tasks added in the last hour, the number of pending tasks,
     *  the number of completed tasks, the number of successful tasks, and the number of errored tasks.
     */
    async getTasksStats(timeInterval: string): Promise<
        | {
              totalTasks: number
              addedTasks: number
              pendingTasks: number
              completedTasks: number
              successTasks: number
              errorTasks: number
          }
        | number
    > {
        try {
            let defaultInterval =
                timeInterval == "" ? "5000 years" : timeInterval

            const queryStr: string = `
    SELECT 
      COUNT(*) AS total_tasks, 
      COUNT(
        CASE WHEN (info ->> 'added_at'):: timestamp > NOW() - INTERVAL ' ${defaultInterval}' THEN 1 END
      ) AS added_tasks, 
      COUNT(
        CASE WHEN status IN ('available', 'processing') AND (info ->> 'added_at')::timestamp > NOW() - INTERVAL '${defaultInterval}' THEN 1 END
      ) AS pending_tasks, 
      COUNT(
        CASE WHEN status IN ('error', 'completed') 
        AND (
          end_time > NOW() - INTERVAL ' ${defaultInterval}'
        ) THEN 1 END
      ) AS completed_tasks, 
      COUNT(
        CASE WHEN status = 'completed' 
        AND (
          end_time > NOW() - INTERVAL ' ${defaultInterval}'
        ) THEN 1 END
      ) AS success_tasks, 
      COUNT(
        CASE WHEN status = 'error' 
        AND (
          end_time > NOW() - INTERVAL '${defaultInterval}'
        ) THEN 1 END
      ) AS error_tasks 
    FROM 
      tasks;`

            const result: QueryResult = await this.client.query(queryStr)

            const queryResult: {
                totalTasks: number
                addedTasks: number
                pendingTasks: number
                completedTasks: number
                successTasks: number
                errorTasks: number
            } = {
                totalTasks: result.rows[0].total_tasks,
                addedTasks: result.rows[0].added_tasks,
                pendingTasks: result.rows[0].pending_tasks,
                completedTasks: result.rows[0].completed_tasks,
                successTasks: result.rows[0].success_tasks,
                errorTasks: result.rows[0].error_tasks,
            }

            return queryResult
        } catch (err) {
            console.error("Error in taskStats:", err)
            return 0
        }
    }
    /**
     * Returns the details of recent queues in the system.
     * @returns {object} The details of recent queues.
     */
    async getRecentQueues(): Promise<
        | {
              id?: string | number
              type?: string | number
              completedTasks?: string | number
              updatedAt?: string | number
              pendingTasks?: string | number
              avgExecTime?: string | number
              EstCompTime?: string | number
          }[]
        | number
    > {
        try {
            const queryStr1: string = `
      WITH RecentQueues AS (
        SELECT 
          id, 
          type,
          TO_TIMESTAMP((info->>'updated_at')::double precision / 1000) AS updated_at
        FROM 
          queues
        ORDER BY 
          TO_TIMESTAMP((info->>'updated_at')::double precision / 1000) DESC
        LIMIT 11
      )
      , PendingTasks AS (
        SELECT 
          q.id AS queue_id
        FROM 
          tasks t
          JOIN queues q ON t.queue_id = q.id
        WHERE 
          t.status NOT IN ('completed', 'error')
      )
      SELECT 
        rq.id AS queue_id,
        rq.type,
        rq.updated_at,
        COUNT(pt.queue_id) AS pending_tasks_count
      FROM 
        RecentQueues rq
        LEFT JOIN PendingTasks pt ON rq.id = pt.queue_id
      GROUP BY 
        rq.id, 
        rq.type, 
        rq.updated_at
      ORDER BY 
        rq.id;
      
    `

            const queryStr2: string = `
      WITH RecentQueues AS (
        SELECT 
          id, 
          type 
     
        FROM 
          queues 
        WHERE 
          TO_TIMESTAMP(
            (info ->> 'updated_at'):: double precision / 1000
          ) > NOW() - INTERVAL '10 minutes'
      ), 
      Tasks AS (
        SELECT 
          q.id AS queue_id, 
          t.end_time - t.start_time AS execution_time, 
          t.status 
        FROM 
          tasks t 
          JOIN queues q ON t.queue_id = q.id
      ), 
      AverageExecutionTime AS (
        SELECT 
          queue_id, 
          AVG(execution_time) AS avg_execution_time_seconds 
        FROM 
          Tasks 
        WHERE 
          status = 'completed' 
        GROUP BY 
          queue_id 
        HAVING 
          COUNT(*) >= 10
      ), 
      TaskCounts AS (
        SELECT 
          rq.id AS queue_id, 
          rq.type, 
          COUNT(
            CASE WHEN t.status IN ('completed', 'error') THEN 1 END
          ) AS completed_tasks_count, 
          COUNT(
            CASE WHEN t.status IN ('processing', 'available') THEN 1 END
          ) AS pending_tasks_count 
        FROM 
          RecentQueues rq 
          LEFT JOIN Tasks t ON rq.id = t.queue_id 
        GROUP BY 
          rq.id, 
          rq.type
      ) 
      SELECT 
        tc.queue_id, 
        tc.type, 
        tc.completed_tasks_count, 
        tc.pending_tasks_count, 
        CASE WHEN tc.completed_tasks_count >= 10 THEN CASE WHEN EXTRACT(
          epoch 
          FROM 
            aet.avg_execution_time_seconds
        ) >= 60 THEN ROUND(
          EXTRACT(
            epoch 
            FROM 
              aet.avg_execution_time_seconds
          ) / 60, 
          2
        ) || ' minutes' ELSE ROUND(
          EXTRACT(
            epoch 
            FROM 
              aet.avg_execution_time_seconds
          ):: numeric, 
          2
        ) || ' seconds' END ELSE NULL END AS avg_execution_time_completed, 
        CASE WHEN tc.pending_tasks_count >= 10 THEN CASE WHEN EXTRACT(
          epoch 
          FROM 
            aet.avg_execution_time_seconds * tc.pending_tasks_count
        ) >= 60 THEN ROUND(
          EXTRACT(
            epoch 
            FROM 
              aet.avg_execution_time_seconds * tc.pending_tasks_count
          ) / 60, 
          2
        ) || ' minutes' ELSE ROUND(
          EXTRACT(
            epoch 
            FROM 
              aet.avg_execution_time_seconds * tc.pending_tasks_count
          ):: numeric, 
          2
        ) || ' seconds' END ELSE NULL END AS estimated_completion_time_pending 
      FROM 
        TaskCounts tc 
        LEFT JOIN AverageExecutionTime aet ON tc.queue_id = aet.queue_id 
      ORDER BY 
        tc.queue_id;
      
    `
            const result1: QueryResult = await this.client.query(queryStr1)
            const result2: QueryResult = await this.client.query(queryStr2)

            if (result1.rows.length === 0 && result2.rows.length === 0) {
                return []
            }

            const joinedResults = result1.rows.map(row1 => {
                const matchingRow2 = result2.rows.find(
                    row2 => row2.queue_id === row1.queue_id
                )
                return { ...row1, ...matchingRow2 }
            })

            const joinedResultsSorted = joinedResults.sort((a, b) => {
                const updatedAtA = new Date(a.updated_at)
                const updatedAtB = new Date(b.updated_at)

                return updatedAtB.getTime() - updatedAtA.getTime()
            })

            const queryResult: {
                id: string | number
                type: string | number
                updatedAt?: string | number
                completedTasks?: string | number
                pendingTasks?: string | number
                avgExecTime?: string | number
                EstCompTime?: string | number
            }[] = joinedResultsSorted.map(result => ({
                id: result.queue_id,
                type: result.type,
                completedTasks: result.completed_tasks_count,
                updatedAt: result.updated_at,
                pendingTasks: result.pending_tasks_count,
                avgExecTime: result.avg_execution_time_completed,
                EstCompTime: result.estimated_completion_time_pending,
            }))

            return queryResult
        } catch (err) {
            console.error("Error in getRecentQueues:", err)
            return 0
        }
    }

    /**
     * Returns the details of all queues in the system.
     * @returns {object} The details of all queues and totalPages.
     */
    async allQueueDetails(query: Record<string, any>): Promise<
        | {
              total_pages: number
              data: Array<{
                  id: number
                  type: string
                  tags: string[]
                  totalPages: number
                  createdAt: Date
                  updatedAt: Date
                  totalTasks: number
              }>
          }
        | number
    > {
        try {
            let queryStr = `
      SELECT
      COUNT(*) OVER () AS total_records,
      q.id AS queue_id,
      q.type AS queue_type,
      ARRAY_AGG(DISTINCT q.tags) AS tags,
      q.info->>'created_at' AS created_at,
      q.info->>'updated_at' AS updated_at,
      COUNT(t.id) AS total_tasks
    FROM
      queues q
    LEFT JOIN
      tasks t ON q.id = t.queue_id
    `

            const queryParams: any[] = []

            if (query.search) {
                const searchTerm = `%${query.search.trim().toLowerCase()}%`

                queryStr += `
          WHERE
            LOWER(q.type) LIKE $1
            OR LOWER(q.tags::text) LIKE $1
        `

                queryParams.push(searchTerm)
            }

            if (query.tag) {
                const tagTerm = query.tag.trim()

                queryStr += `
          WHERE
             $1 = ANY(q.tags)
        `

                queryParams.push(tagTerm)
            }

            if (query.sortBy && query.sortOrder) {
                const validSortByFields = [
                    "id",
                    "type",
                    "tags",
                    "created_at",
                    "updated_at",
                ]

                if (validSortByFields.includes(query.sortBy)) {
                    if (
                        query.sortBy === "created_at" ||
                        query.sortBy === "updated_at"
                    ) {
                        queryStr += `
              GROUP BY
                q.id, q.type, q.info->>'created_at', q.info->>'updated_at'
              ORDER BY
                q.info->>'${query.sortBy}' ${query.sortOrder.toUpperCase()}
            `
                    } else {
                        queryStr += `
              GROUP BY
                q.id, q.type, q.info->>'created_at', q.info->>'updated_at'
              ORDER BY
                q.${query.sortBy} ${query.sortOrder.toUpperCase()}
            `
                    }
                }
            } else {
                queryStr += `
          GROUP BY
            q.id, q.type, q.info->>'created_at', q.info->>'updated_at'
          ORDER BY
            MAX(q.info->>'updated_at') DESC
        `
            }

            const preResult: QueryResult = await this.client.query(
                queryStr,
                queryParams
            )

            const totalRecords = preResult.rows[0].total_records ?? 0

            const pageSize = parseInt(query.pageSize) || 10
            const totalPages = Math.ceil(totalRecords / pageSize)
            const page = parseInt(query.page) || 1
            const offset = parseInt(query.offset) || (page - 1) * pageSize
            const limit = parseInt(query.limit) || pageSize

            queryParams.push(limit, offset)

            queryStr += ` LIMIT $${queryParams.length - 1} OFFSET $${
                queryParams.length
            }`

            const result: QueryResult = await this.client.query(
                queryStr,
                queryParams
            )

            const queuesDetails: Array<{
                id: number
                type: string
                tags: string[]
                totalPages: number
                createdAt: Date
                updatedAt: Date
                totalTasks: number
            }> = result.rows.map(row => ({
                id: row.queue_id,
                type: row.queue_type,
                tags: row.tags,
                totalPages: row.total_pages,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                totalTasks: row.total_tasks,
            }))

            return {
                total_pages: totalPages,
                data: queuesDetails,
            }
        } catch (err) {
            console.error("Error in allQueueDetails:", err)
            return 0
        }
    }

    /**
     * Returns the details of a specific queue.
     * @returns {object} The details of the queue.
     */
    async getQueueDetails(
        queue: string | number,
        query: Record<string, any>
    ): Promise<
        | {
              queue_id: string | number
              tags: []
              options: { callback: string; expiryTime: string }
              created_at: string
              updated_at: string
              notes: string
              tasks: []
              total_tasks: number | string
              completed_tasks: number | string
              error_tasks: string
              processing_tasks: string
          }
        | number
    > {
        try {
            let queryStr: string = `
      SELECT
        q.id AS queue_id,
        q.type,
        q.tags,
        q.options,
        q.info->>'created_at' AS created_at,
        q.info->>'updated_at' AS updated_at,
        q.notes,
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'taskId', t.id,
              'task_id', t.task_id,
              'params', t.params,
              'priority', t.priority,
              'status', t.status,
              'result', t.result,
              'start_time', t.start_time,
              'end_time', t.end_time,
              'expiry_time', t.expiry_time,
              'execution_time', CASE
                                  WHEN t.end_time IS NOT NULL AND t.start_time IS NOT NULL THEN
                                    ROUND(EXTRACT(EPOCH FROM (t.end_time - t.start_time))::numeric, 2)
                                  ELSE
                                    NULL
                                END
            )
          )
          FROM (
            SELECT *
            FROM tasks
            WHERE queue_id = q.id
            LIMIT 10
          ) t
        ) AS tasks,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status IN ('completed', 'error') THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status IN ('error') THEN 1 ELSE 0 END) AS error_tasks,
        SUM(CASE WHEN t.status IN ('processing') THEN 1 ELSE 0 END) AS processing_tasks
      FROM
        queues q
      LEFT JOIN
        tasks t ON q.id = t.queue_id
      WHERE
        q.id = $1

    `

            if (query.status) {
                queryStr += " AND t.status = $2"
            }

            queryStr += `
      GROUP BY
        q.id, q.type, q.tags, q.options, q.info, q.notes
      ORDER BY
        q.id
    `

            const parameters = query.status
                ? [Number(queue), query?.status]
                : [queue]

            const result: QueryResult = await this.client.query(
                queryStr,
                parameters
            )

            const queryResult: {
                queue_id: ""
                tags: []
                options: { callback: ""; expiryTime: "" }
                created_at: ""
                updated_at: ""
                notes: ""
                tasks: []
                total_tasks: ""
                completed_tasks: ""
                error_tasks: ""
                processing_tasks: ""
            } = {
                queue_id: result.rows[0]?.queue_id,
                tags: result.rows[0]?.tags,
                options: result.rows[0]?.options,
                created_at: result.rows[0]?.created_at,
                updated_at: result.rows[0]?.updated_at,
                notes: result.rows[0]?.notes,
                tasks: result.rows[0]?.tasks,
                total_tasks: result.rows[0]?.total_tasks,
                completed_tasks: result.rows[0]?.completed_tasks,
                error_tasks: result.rows[0]?.error_tasks,
                processing_tasks: result.rows[0]?.processing_tasks,
            }

            return queryResult
        } catch (err) {
            console.error("Error in getRecentQueues:", err)
            return 0
        }
    }

    //
    ///
    ///
    //
    ///
    //
    //
    //
    //
    //
    //
    ///
    //
    //
    ///
    //
    //
    async queueAndTasksCounts(): Promise<
        | {
              total_tasks: string
              pending_tasks: string
              ongoing_queues: number[]
          }
        | number
    > {
        try {
            const queryStr: string = `
      SELECT
      (SELECT COUNT(id) FROM tasks) AS total_tasks,
      (SELECT COUNT(id)
       FROM tasks
       WHERE status NOT IN ('completed', 'error')) AS pending_tasks,
      (SELECT ARRAY_AGG(id)
       FROM queues q
       WHERE EXISTS (
         SELECT 1
         FROM tasks t
         WHERE t.queue_id = q.id
           AND t.status = 'processing'
       )
       LIMIT 1) AS ongoing_queues;
    
    `

            const result: QueryResult = await this.client.query(queryStr)

            const queuesResult: {
                total_tasks: ""
                pending_tasks: ""
                ongoing_queues: number[]
            } = {
                total_tasks: result.rows[0].total_tasks ?? 0,
                pending_tasks: result.rows[0].pending_tasks ?? 0,
                ongoing_queues: result.rows[0].ongoing_queues ?? [],
            }

            return queuesResult
        } catch (err) {
            console.error("Error in queueCounts:", err)
            return 0
        }
    }

    async TasksDetailsOfQueues(queues: number[]): Promise<
        | Array<{
              id: number
              type: string
              totalTasks: number
              availableTasks: number
              processingTasks: number
              completedTasks: number
              errorTasks: number
          }>
        | number
    > {
        try {
            const queryStr: string = `

      WITH QueueTasks AS (
        SELECT
          q.id AS queue_id,
          q.type AS queue_type,
          COUNT(t.id) AS total_tasks,
          COUNT(t.id) FILTER (WHERE t.status = 'available') AS available_tasks,
          COUNT(t.id) FILTER (WHERE t.status = 'processing') AS processing_tasks,
          COUNT(t.id) FILTER (WHERE t.status IN ('completed', 'error')) AS completed_or_error_tasks,
          COUNT(t.id) FILTER (WHERE t.status = 'error') AS error_tasks
        FROM
          queues q
          LEFT JOIN tasks t ON q.id = t.queue_id
        WHERE
          q.id = ANY($1) 
        GROUP BY
          q.id
      )
      SELECT
        jsonb_build_object(
          'queue_id', qt.queue_id,
          'queue_type', qt.queue_type,
          'total_tasks', qt.total_tasks,
          'available_tasks', qt.available_tasks,
          'processing_tasks', qt.processing_tasks,
          'completed_or_error_tasks', qt.completed_or_error_tasks,
          'error_tasks', qt.error_tasks
        ) AS queue_details
      FROM
        QueueTasks qt;
      
    `
            const result: QueryResult = await this.client.query(queryStr, [
                queues,
            ])

            if (result.rows.length > 0) {
                const queuesDetails: Array<{
                    id: number
                    type: string
                    totalTasks: number
                    availableTasks: number
                    processingTasks: number
                    completedTasks: number
                    errorTasks: number
                }> = result.rows.map((row: any) => {
                    const queueDetails = row.queue_details
                    return {
                        id: queueDetails.queue_id,
                        type: queueDetails.queue_type,
                        totalTasks: queueDetails.total_tasks,
                        availableTasks: queueDetails.available_tasks,
                        processingTasks: queueDetails.processing_tasks,
                        completedTasks: queueDetails.completed_or_error_tasks,
                        errorTasks: queueDetails.error_tasks,
                    }
                })

                return queuesDetails
            } else {
                return []
            }
        } catch (err) {
            console.error("Error in TasksDetailsOfQueues:", err)
            return []
        }
    }

    async completedQueues(): Promise<
        | {
              completed_queues: (string | number)[]
          }
        | []
    > {
        try {
            const queryStr: string = `

      SELECT ARRAY(
        SELECT DISTINCT q.id
        FROM queues q
        WHERE NOT EXISTS (
          SELECT 1
          FROM tasks t
          WHERE t.queue_id = q.id
            AND t.status NOT IN ('completed', 'error')
        )
      ) AS completed_queue_ids;     
   `
            const result: QueryResult = await this.client.query(queryStr)

            const queuesResult: {
                completed_queues: (string | number)[]
            } = {
                completed_queues: result.rows[0].completed_queue_ids ?? [],
            }

            return queuesResult
        } catch (err) {
            console.error("Error in completedQueues:", err)
            return []
        }
    }

    async TaskDetailsOfQueue(
        queue: number,
        query: Record<string, any>
    ): Promise<any> {
        try {
            let queryStr: string = `

      SELECT *
      FROM tasks
      WHERE queue_id = $1
    
 `

            if (query.viewAll === "true") {
                queryStr = queryStr.replace("LIMIT 10", "")
            } else {
                queryStr += "LIMIT 10"
            }
            const result: QueryResult = await this.client.query(queryStr, [
                queue,
            ])

            const queuesResult = result.rows
            return queuesResult
        } catch (err) {
            console.error("Error in completedQueues:", err)
            return []
        }
    }

    async TasksCompletedWithinAnHour(): Promise<any> {
        try {
            let queryStr: string = `

      SELECT COUNT(*)
      FROM tasks
      WHERE end_time >= NOW() - INTERVAL '1 hour';
      
 `

            const result: QueryResult = await this.client.query(queryStr)

            const queuesResult = result.rows

            return queuesResult
        } catch (err) {
            console.error("Error in completedQueues:", err)
            return []
        }
    }

    async getParamAndResult(taskId: string | number): Promise<any> {
        try {
            let queryStr: string = `

      SELECT params, result
      FROM tasks
      WHERE task_id = $1
      LIMIT 1;
 `

            const result: QueryResult = await this.client.query(queryStr, [
                taskId,
            ])

            const queuesResult = result.rows

            return queuesResult
        } catch (err) {
            console.error("Error in completedQueues:", err)
            return []
        }
    }
}
