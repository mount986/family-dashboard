export interface TodoList {
  id: string
  name: string
  ownerId: string
  isShared: boolean
  createdAt: string
}

export type TodoPriority = 1 | 2 | 3 // 1 = high, 2 = medium, 3 = low

export interface TodoItem {
  id: string
  listId: string
  text: string
  assignedTo: string | null
  dueDate: string | null
  priority: TodoPriority
  completedAt: string | null
  createdAt: string
}

export interface CreateTodoItemInput {
  text: string
  assignedTo?: string
  dueDate?: string
  priority?: TodoPriority
}

export interface UpdateTodoItemInput {
  text?: string
  assignedTo?: string | null
  dueDate?: string | null
  priority?: TodoPriority
  completedAt?: string | null
}
