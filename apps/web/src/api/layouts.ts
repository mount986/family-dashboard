import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Breakpoint, CardLayout, DashboardLayout } from '@family-dashboard/types'

export const layoutKeys = {
  all: ['layouts'] as const,
}

export function useLayouts() {
  return useQuery({
    queryKey: layoutKeys.all,
    queryFn: () => api.get<DashboardLayout>('/layouts'),
  })
}

export function useSaveLayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ breakpoint, layout }: { breakpoint: Breakpoint; layout: CardLayout[] }) =>
      api.put<void>(`/layouts/${breakpoint}`, { layout }),
    onSuccess: (_, { breakpoint, layout }) => {
      qc.setQueryData<DashboardLayout>(layoutKeys.all, (old) =>
        old ? { ...old, [breakpoint]: layout } : old
      )
    },
  })
}

export function useHideCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => api.delete(`/layouts/cards/${cardId}`),
    // Remove the card from every breakpoint in the local cache immediately
    onSuccess: (_, cardId) => {
      qc.setQueryData<DashboardLayout>(layoutKeys.all, (old) => {
        if (!old) return old
        const next = {} as DashboardLayout
        for (const bp of Object.keys(old) as Breakpoint[]) {
          next[bp] = old[bp].filter((cl) => cl.cardId !== cardId)
        }
        return next
      })
    },
  })
}
