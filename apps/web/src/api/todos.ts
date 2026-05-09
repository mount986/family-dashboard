import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  TodoList,
  TodoItem,
  CreateTodoListInput,
  CreateTodoItemInput,
  UpdateTodoItemInput,
} from '@family-dashboard/types'

export const todoKeys = {
  list: (listId: string) => ['todos', listId] as const,
}

// ── Create list (also patches the card config with listId) ────────────────────

export function useCreateTodoList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTodoListInput) =>
      api.post<TodoList>('/todos/lists', input),
    onSuccess: (list) => {
      qc.setQueryData<{ list: TodoList; items: TodoItem[] }>(
        todoKeys.list(list.id),
        { list, items: [] }
      )
    },
  })
}

// ── Fetch list + items ────────────────────────────────────────────────────────

export function useTodoList(listId: string | undefined) {
  return useQuery({
    queryKey: todoKeys.list(listId ?? ''),
    queryFn: () => api.get<{ list: TodoList; items: TodoItem[] }>(`/todos/lists/${listId}`),
    enabled: !!listId,
  })
}

// ── Item mutations ────────────────────────────────────────────────────────────

export function useCreateTodoItem(listId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTodoItemInput) =>
      api.post<TodoItem>(`/todos/lists/${listId}/items`, input),
    onSuccess: (item) => {
      qc.setQueryData<{ list: TodoList; items: TodoItem[] }>(
        todoKeys.list(listId),
        (old) => old ? { ...old, items: [...old.items, item] } : old
      )
    },
  })
}

export function useUpdateTodoItem(listId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, ...input }: UpdateTodoItemInput & { itemId: string }) =>
      api.patch<TodoItem>(`/todos/lists/${listId}/items/${itemId}`, input),
    onSuccess: (updated) => {
      qc.setQueryData<{ list: TodoList; items: TodoItem[] }>(
        todoKeys.list(listId),
        (old) => old
          ? { ...old, items: old.items.map((i) => i.id === updated.id ? updated : i) }
          : old
      )
    },
  })
}

export function useDeleteTodoItem(listId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/todos/lists/${listId}/items/${itemId}`),
    onSuccess: (_, itemId) => {
      qc.setQueryData<{ list: TodoList; items: TodoItem[] }>(
        todoKeys.list(listId),
        (old) => old ? { ...old, items: old.items.filter((i) => i.id !== itemId) } : old
      )
    },
  })
}
