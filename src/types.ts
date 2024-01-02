export type TaskParams = {
  num1: number
  num2: number
}

export type Task = {
  taskId: string
  params: TaskParams
  priority?: number
}

export type createQueueType = {
  type: string
  tasks: [...Task[]]
  tags?: string[]
  options?: Options
}

export type addTasksType = {
  queue: number
  tasks: [...Task[]]
  tags?: string[] | undefined
  options?: Options | undefined
}

export type Options = {
  expiryTime: number
  callback: string
}
