const root: string = "http://127.0.0.1:8484"
// const root: string = "https://lean-queue.vercel.app";

export const getNextTask = async (
    using: string,
    value: string | number
): Promise<any> => {
    for (let i = 0; i < 3; i++) {
        try {
            const requestBody = { [using]: value }
            const response = await fetch(root + "/next-available-task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok || !response.body) {
                console.error("Empty response received. Retrying...")
                continue
            }

            const data = await response.json()
            return data
        } catch (error) {
            console.error(`Error: ${error}. Retrying...`)
        }
    }
    return null
}

export const sendResults = async (
    taskId: string | number,
    result: any,
    error: any
): Promise<Response | undefined> => {
    try {
        const requestBody = { id: taskId, result: result, error: error }
        const response = await fetch(root + "/submit-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        })

        return response
    } catch (error) {
        console.error("Error while sending result:", error)
    }
}
