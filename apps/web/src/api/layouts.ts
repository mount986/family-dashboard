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
    // Quietly update cache so a hard-refresh doesn't flash stale positions
    onSuccess: (_, { breakpoint, layout }) => {
      qc.setQueryData<DashboardLayout>(layoutKeys.all, (old) =>
        old ? { ...old, [breakpoint]: layout } : old
      )
    },
  })
}
