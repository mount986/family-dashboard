import { useState } from 'react'
import type { ProfileSummary } from '@family-dashboard/types'
import {
  useProfiles,
  useSession,
  useSwitchProfile,
} from '@/api/profiles'
import { useSessionStore } from '@/store/session'
import { PinModal, parseSwitchError } from './PinModal'

interface ProfileSwitcherProps {
  onManageProfiles: () => void
}

export function ProfileSwitcher({ onManageProfiles }: ProfileSwitcherProps) {
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles()
  const { data: serverSession } = useSession()
  const switchProfile = useSwitchProfile()
  const setSession = useSessionStore((s) => s.setSession)
  const isAdmin = serverSession?.isAdmin ?? false

  const [pinTarget, setPinTarget] = useState<ProfileSummary | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)

  // Sync TanStack Query session result into Zustand store
  if (serverSession) setSession(serverSession)

  const activeId = serverSession?.profileId

  async function handleSelect(profile: ProfileSummary) {
    if (profile.id === activeId) return

    if (profile.isAdmin) {
      setPinTarget(profile)
      setPinError(null)
      return
    }

    try {
      const session = await switchProfile.mutateAsync({ profileId: profile.id })
      setSession(session)
    } catch {
      // Public profile switch shouldn't fail — surface nothing
    }
  }

  async function handlePinSubmit(pin: string) {
    if (!pinTarget) return
    setPinError(null)

    try {
      const session = await switchProfile.mutateAsync({ profileId: pinTarget.id, pin })
      setSession(session)
      setPinTarget(null)
    } catch (err) {
      setPinError(parseSwitchError(err))
    }
  }

  if (profilesLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-800 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <nav className="flex flex-col gap-1 p-3">
        {profiles.map((profile) => {
          const isActive = profile.id === activeId
          return (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile)}
              className={[
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors',
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              ].join(' ')}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: profile.colorTheme }}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile.name[0]?.toUpperCase()
                )}
              </div>

              {/* Name */}
              <span className="flex-1 text-sm font-medium truncate">{profile.name}</span>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {profile.isAdmin && (
                  <span className="text-slate-500" title="Admin profile">🔒</span>
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </div>
            </button>
          )
        })}

        {/* Manage profiles — admin only */}
        {isAdmin && (
          <button
            onClick={onManageProfiles}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors mt-1 border-t border-slate-800 pt-3"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
              ⚙
            </div>
            <span className="text-sm font-medium">Manage profiles</span>
          </button>
        )}
      </nav>

      {pinTarget && (
        <PinModal
          profile={pinTarget}
          onSuccess={handlePinSubmit}
          onCancel={() => { setPinTarget(null); setPinError(null) }}
          isLoading={switchProfile.isPending}
          error={pinError}
        />
      )}
    </>
  )
}
