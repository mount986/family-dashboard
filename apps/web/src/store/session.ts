import { create } from 'zustand'
import type { ActiveSession } from '@family-dashboard/types'

interface SessionState {
  session: ActiveSession | null
  setSession: (session: ActiveSession | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}))
