export type TaskParams = {
  num1: number
  num2: number
}

export type Task = {
  taskId: string
  params: TaskParams
  priority?: number
}

export type CreateQueueType = {
  type: string
  tasks: Task[]
  tags?: string[]
  notes?: string
  options?: QueueOptions
}

export type AddTasksType = {
  queue: number
  tasks: Task[]
  tags?: string[]
}

export type QueueOptions = {
  expiryTime: number
  callback: string
}

export type SubmitResultsResponse = {
  queue: number
  callbackUrl: string
}
