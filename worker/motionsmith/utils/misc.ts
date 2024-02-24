import { exec } from "child_process"
import * as fs from "fs"

export const renderVideo = (
    rendererPath: string,
    videoOutPath: string,
    template: string,
    renderData: {}
): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            fs.mkdirSync(videoOutPath, { recursive: true })
        } catch (error: any) {
            console.error(`Error creating directory: ${error.message}`)
            reject(null)
        }
        const currentDateTime = new Date().toISOString()
        const filename = template + currentDateTime
        exec(
            `cd ${rendererPath} && npx remotion render ${template} ${videoOutPath}/${filename}.mp4 --gl=angle --props='${renderData}'`,
            (error, stdout, stderr) => {
                if (error) {
                    // console.error(`Error rendering video: ${error.message}`)
                }

                if (stderr) {
                    // console.error(`Error rendering video: ${stderr}`)
                }

                if (stdout) {
                    // console.log("Video rendering successful")
                    resolve(filename)
                }
            }
        )
    })
}
