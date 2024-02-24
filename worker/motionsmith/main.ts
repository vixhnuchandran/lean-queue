import { renderVideo } from "./utils/misc"
import * as queue from "./utils/queue"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import fs from "fs"
import util from "util"
import logger from "./utils/logger"
dotenv.config()

const supabaseUrl = "https://yabwzcdssqwkvulfxbiy.supabase.co"
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey!)

const readFileAsync = util.promisify(fs.readFile)

async function processTask(taskDetails: {
    id: string
    params: { template: string; data: any }
}) {
    const taskId = taskDetails.id
    const template = taskDetails.params.template
    const renderData = taskDetails.params.data
    const modelName = taskDetails.params.data.objects[0].specs.model_name

    logger.info(
        `Using template ${taskDetails.params.template} and model name ${modelName}.`,
        { taskId }
    )

    const rendererPath = "../../../story-maker/"
    const videoOutPath = "../lean_queue/worker/motionsmith/out"

    // Render video using renderData
    const filename = await renderVideo(
        rendererPath,
        videoOutPath,
        template,
        JSON.stringify(renderData)
    )
    if (!filename) {
        logger.error(`Rendering failed.`, { taskId })

        await queue.sendResults(taskId, null, { error: "Rendering failed" })
        return
    }

    logger.info(`Rendered successfully ${filename}.`, { taskId })

    try {
        const filePath = `./out/${filename}.mp4`
        const fileBlob = await readFileAsync(filePath)

        // Upload to Supabase bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("motionsmith")
            .upload(`flipkart/${filename}.mp4`, fileBlob)

        if (uploadError) {
            logger.error(
                `Error occurred while uploading the video: ${uploadError.message}`,
                { taskId }
            )
            return
        }

        logger.info("Video uploaded successfully", { taskId })

        // Get public URL from Supabase bucket
        const { data: urlData } = await supabase.storage
            .from("motionsmith")
            .getPublicUrl(`flipkart/${filename}.mp4`)

        const downloadUrl = urlData.publicUrl

        // Submit result as URL
        await queue.sendResults(taskId, { url: downloadUrl }, null)
        logger.info("Result submitted successfully.", { taskId })
    } catch (error: any) {
        logger.error("An error occurred:", error)
        await queue.sendResults(taskId, null, { error: error.message })
    } finally {
        // Delete video from disk '/out'
    }
}

async function main() {
    while (true) {
        try {
            const taskDetails = await queue.getNextTask("type", "flipkart")
            if (!taskDetails) {
                console.log("No tasks available right now!")
                await new Promise(resolve => setTimeout(resolve, 60 * 1000))
                continue
            }

            await processTask(taskDetails)
        } catch (error) {
            console.error("An error occurred:", error)
            break
        }
    }
}

async function run() {
    await main()
}

run()
