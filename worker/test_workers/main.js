const fs = require("fs")
const axios = require("axios")

const root = "http://127.0.0.1:8484"
// const root = "https://lean-queue.vercel.app";
const stateFile = "queue_state.json"

const createQueue = async (taskData, type) => {
  const queueJson = {
    type: type,
    tasks: [],
    tags: [type, "dev", "localdb"],
    options: {
      expiryTime: 150000,
      callback: "https://someurl.com",
      retries: 3,
    },
    notes: `Main queue for ${type}`,
  }

  const newTasks = JSON.parse(taskData)

  newTasks.forEach((taskData, index) => {
    const taskJson = {
      taskId: (index + 1001 + queueJson.tasks.length).toString(),
      params: { data: taskData },
      priority: Math.floor(Math.random() * 10) + 1,
    }
    queueJson.tasks.push(taskJson)
  })

  try {
    const url = root + "/create-queue"
    const response = await axios.post(url, queueJson)
    const queueId = response.data.queue
    console.log(`Queue created successfully with id ${queueId}`)
    return queueId
  } catch (error) {
    console.error(`Error creating queue: ${error}`)
    throw error
  }
}

const queueResult = async queueId => {
  try {
    const url = `${root}/completed-results/${queueId}`
    const response = await axios.get(url)
    console.log(`Results successfully returned for queue id ${queueId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching queue results: ${error}`)
    throw error
  }
}

const saveState = tasks => {
  const currentState = loadState()
  currentState.tasks = currentState.tasks.concat(tasks)
  fs.writeFileSync(stateFile, JSON.stringify(currentState)) // Write the updated state back to the file
}

const loadState = () => {
  if (fs.existsSync(stateFile)) {
    const data = fs.readFileSync(stateFile, "utf8")
    return JSON.parse(data)
  } else {
    return { tasks: [] }
  }
}

const main = async () => {
  const args = process.argv.slice(2)

  const dataFlagIndex = args.indexOf("--data")
  const typeFlagIndex = args.indexOf("--type")
  const resetFlagIndex = args.indexOf("-r")

  if (
    dataFlagIndex === -1 ||
    dataFlagIndex === args.length - 1 ||
    typeFlagIndex === -1 ||
    typeFlagIndex === args.length - 1
  ) {
    console.error(
      `Usage: node script.js --data '["abc", "lmn", "xyz"]' --type <type> [-r]`
    )
    process.exit(1)
  }

  const taskData = args[dataFlagIndex + 1]
  const type = args[typeFlagIndex + 1]
  const shouldReset = resetFlagIndex !== -1

  if (!shouldReset) {
    const savedState = loadState()
    const remainingTasks = savedState.tasks
    const newTasks = JSON.parse(taskData)

    const tasksToAdd = newTasks.filter(task => {
      const taskStr = JSON.stringify(task)
      return !remainingTasks.some(
        savedTask => JSON.stringify(savedTask) === taskStr
      )
    })

    try {
      if (tasksToAdd.length > 0) {
        const queueId = await createQueue(JSON.stringify(tasksToAdd), type)
        await queueResult(queueId).then(result => console.log(result))
        await saveState(tasksToAdd) // Await the saveState function call
      } else {
        console.log("All tasks are already processed. Nothing new to add.")
      }
    } catch (error) {
      console.error("Error:", error)
      process.exit(1)
    }
  } else {
    try {
      const queueId = await createQueue(taskData, type)
      await queueResult(queueId).then(result => console.log(result))
    } catch (error) {
      console.error("Error:", error)
      process.exit(1)
    }
  }
}

main()
