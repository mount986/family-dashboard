import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProfileSwitcher } from '@/components/profiles/ProfileSwitcher'
import { ProfileManager } from '@/components/profiles/ProfileManager'
import { BootstrapScreen } from '@/components/bootstrap/BootstrapScreen'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { useSession } from '@/api/profiles'
import { useSessionStore } from '@/store/session'
import { api } from '@/api/client'

export default function App() {
  const [manageOpen, setManageOpen] = useState(false)
  const { data: serverSession } = useSession()
  const session = useSessionStore((s) => s.session) ?? serverSession

  // Check whether first-time setup is needed
  const { data: bootstrapData, isLoading: bootstrapLoading } = useQuery({
    queryKey: ['bootstrap'],
    queryFn: () => api.get<{ needed: boolean }>('/bootstrap'),
    staleTime: Infinity, // Once false, it stays false — no need to re-check
  })

  if (bootstrapLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (bootstrapData?.needed) {
    return <BootstrapScreen />
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        <div className="px-4 py-4 border-b border-slate-800">
          <h1 className="text-white font-bold text-base tracking-tight">Family Dashboard</h1>
          {session && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">{session.profileName}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Profiles
          </p>
          <ProfileSwitcher onManageProfiles={() => setManageOpen(true)} />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {session ? (
          // Key on profileId so DashboardGrid fully remounts on profile switch,
          // clearing any local layout state from the previous profile.
          <DashboardGrid key={session.profileId} isAdmin={session.isAdmin} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-lg">Select a profile to get started</p>
          </div>
        )}
      </main>

      {manageOpen && <ProfileManager onClose={() => setManageOpen(false)} />}
    </div>
  )
}
