import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Card, CreateCardInput, UpdateCardInput } from '@family-dashboard/types'

export const cardKeys = {
  all: ['cards'] as const,
}

export function useCards() {
  return useQuery({
    queryKey: cardKeys.all,
    queryFn: () => api.get<Card[]>('/cards'),
  })
}

export function useCreateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCardInput) => api.post<Card>('/cards', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardKeys.all }),
  })
}

export function useUpdateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCardInput & { id: string }) =>
      api.patch<Card>(`/cards/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardKeys.all }),
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cards/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardKeys.all }),
  })
}
