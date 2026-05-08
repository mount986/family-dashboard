import { useState } from 'react'
import type { ProfileSummary } from '@family-dashboard/types'
import { useProfiles } from '@/api/profiles'
import { ProfileForm } from './ProfileForm'

interface ProfileManagerProps {
  onClose: () => void
}

export function ProfileManager({ onClose }: ProfileManagerProps) {
  const { data: profiles = [] } = useProfiles()
  const [editing, setEditing] = useState<ProfileSummary | 'new' | null>(null)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold">
            {editing === 'new' ? 'New profile' : editing ? `Edit — ${editing.name}` : 'Profiles'}
          </h2>
          <button
            onClick={editing ? () => setEditing(null) : onClose}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            {editing ? '← Back' : '✕'}
          </button>
        </div>

        <div className="p-5">
          {/* Form view */}
          {editing && (
            <ProfileForm
              {...(editing !== 'new' ? { profile: editing } : {})}
              onDone={() => setEditing(null)}
            />
          )}

          {/* List view */}
          {!editing && (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setEditing(profile)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: profile.colorTheme }}
                  >
                    {profile.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{profile.name}</p>
                    <p className="text-slate-500 text-xs">{profile.isAdmin ? 'Admin' : 'Standard'}</p>
                  </div>
                  <span className="text-slate-600 text-sm">›</span>
                </button>
              ))}

              <button
                onClick={() => setEditing('new')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-300 mt-3"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                  +
                </div>
                <span className="text-sm font-medium">Add profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
