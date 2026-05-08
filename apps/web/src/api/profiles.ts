import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  ProfileSummary,
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
  ActiveSession,
  SwitchProfileInput,
} from '@family-dashboard/types'

// ── Query keys ────────────────────────────────────────────────────────────────

export const profileKeys = {
  all: ['profiles'] as const,
  session: ['session'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => api.get<ProfileSummary[]>('/profiles'),
  })
}

export function useSession() {
  return useQuery({
    queryKey: profileKeys.session,
    queryFn: () => api.get<ActiveSession>('/session'),
    retry: false, // 401 is expected when no session exists — don't retry
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProfileInput) => api.post<Profile>('/profiles', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.all }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProfileInput & { id: string }) =>
      api.patch<Profile>(`/profiles/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.all }),
  })
}

export function useDeleteProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/profiles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.all }),
  })
}

export function useSwitchProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SwitchProfileInput) => api.post<ActiveSession>('/profiles/switch', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.session }),
  })
}

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/session'),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.session }),
  })
}
