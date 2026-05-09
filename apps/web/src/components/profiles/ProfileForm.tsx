import { useState } from 'react'
import type { Profile, ProfileSummary, ProfileTheme } from '@family-dashboard/types'
import { useCreateProfile, useUpdateProfile, useDeleteProfile } from '@/api/profiles'

const THEME_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#0f172a',
]

interface ProfileFormProps {
  /** Pass an existing profile to edit, omit to create new */
  profile?: ProfileSummary | Profile
  onDone: () => void
}

export function ProfileForm({ profile, onDone }: ProfileFormProps) {
  const isEditing = !!profile

  const [name, setName] = useState(profile?.name ?? '')
  const [colorTheme, setColorTheme] = useState(profile?.colorTheme ?? '#6366f1')
  const [theme, setTheme] = useState<ProfileTheme>(profile?.theme ?? 'dark')
  const [isAdmin, setIsPrivate] = useState(profile?.isAdmin ?? false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const createProfile = useCreateProfile()
  const updateProfile = useUpdateProfile()
  const deleteProfile = useDeleteProfile()

  const isPending = createProfile.isPending || updateProfile.isPending

  function validate(): string | null {
    if (!name.trim()) return 'Name is required'
    if (isAdmin && !isEditing && pin.length < 4) return 'PIN must be at least 4 digits'
    if (isAdmin && !isEditing && pin !== confirmPin) return 'PINs do not match'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setFormError(err); return }
    setFormError(null)

    try {
      if (isEditing && profile) {
        await updateProfile.mutateAsync({
          id: profile.id,
          name: name.trim(),
          colorTheme,
          theme,
          isAdmin,
        })
      } else {
        await createProfile.mutateAsync({
          name: name.trim(),
          colorTheme,
          theme,
          isAdmin,
          ...(isAdmin ? { pin } : {}),
        })
      }
      onDone()
    } catch {
      setFormError('Something went wrong. Please try again.')
    }
  }

  async function handleDelete() {
    if (!profile) return
    if (!window.confirm(`Delete "${profile.name}"? This cannot be undone.`)) return
    await deleteProfile.mutateAsync(profile.id)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="e.g. Mom, Dad, Alex"
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Color theme */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setColorTheme(color)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: color }}
              title={color}
            >
              {colorTheme === color && (
                <span className="flex items-center justify-center w-full h-full text-white text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                theme === t
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500',
              ].join(' ')}
            >
              <span>{t === 'dark' ? '🌙' : '☀️'}</span>
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Private toggle */}
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm font-medium text-slate-300">Admin profile</p>
          <p className="text-xs text-slate-500">Requires a PIN to switch to and can manage profiles</p>
        </div>
        <button
          type="button"
          onClick={() => setIsPrivate((v) => !v)}
          className={[
            'relative w-11 h-6 rounded-full transition-colors focus:outline-none',
            isAdmin ? 'bg-indigo-600' : 'bg-slate-700',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              isAdmin ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>

      {/* PIN fields — only for new private profiles */}
      {isAdmin && !isEditing && (
        <div className="space-y-3 border-t border-slate-700 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="4–8 digits"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Repeat PIN"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {formError && (
        <p className="text-red-400 text-sm">{formError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-900/30 text-sm font-medium transition-colors"
          >
            Delete
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Saving…' : isEditing ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  )
}
