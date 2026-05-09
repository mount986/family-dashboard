import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { GroceryItem, CreateGroceryItemInput, UpdateGroceryItemInput } from '@family-dashboard/types'

export const groceryKeys = {
  all: ['grocery'] as const,
}

export function useGroceryItems() {
  return useQuery({
    queryKey: groceryKeys.all,
    queryFn: () => api.get<GroceryItem[]>('/grocery'),
  })
}

export function useCreateGroceryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGroceryItemInput) => api.post<GroceryItem>('/grocery', input),
    onSuccess: (item) => {
      qc.setQueryData<GroceryItem[]>(groceryKeys.all, (old) => old ? [...old, item] : [item])
    },
  })
}

export function useUpdateGroceryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateGroceryItemInput & { id: string }) =>
      api.patch<GroceryItem>(`/grocery/${id}`, input),
    onSuccess: (updated) => {
      qc.setQueryData<GroceryItem[]>(groceryKeys.all, (old) =>
        old ? old.map((i) => i.id === updated.id ? updated : i) : old
      )
    },
  })
}

export function useDeleteGroceryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/grocery/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData<GroceryItem[]>(groceryKeys.all, (old) =>
        old ? old.filter((i) => i.id !== id) : old
      )
    },
  })
}

export function useClearCheckedItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/grocery/checked'),
    onSuccess: () => {
      qc.setQueryData<GroceryItem[]>(groceryKeys.all, (old) =>
        old ? old.filter((i) => !i.isChecked) : old
      )
    },
  })
}
