import { useEffect, useRef, useState } from 'react'
import type { ProfileSummary } from '@family-dashboard/types'
import { ApiResponseError } from '@/api/client'

interface PinModalProps {
  profile: ProfileSummary
  onSuccess: (pin: string) => void
  onCancel: () => void
  isLoading: boolean
  error?: string | null
}

export function PinModal({ profile, onSuccess, onCancel, isLoading, error }: PinModalProps) {
  const [pin, setPin] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Clear PIN on error so the user can retry immediately
  useEffect(() => {
    if (error) setPin('')
  }, [error])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length >= 4) onSuccess(pin)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onCancel()
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-sm mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6"
        onKeyDown={handleKeyDown}
      >
        {/* Profile identity */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: profile.colorTheme }}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              profile.name[0]?.toUpperCase()
            )}
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">{profile.name}</p>
            <p className="text-slate-400 text-sm">Enter PIN to continue</p>
          </div>
        </div>

        {/* PIN input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-[0.5em] bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length < 4 || isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Helper to extract a human-readable error message from a switch mutation error
export function parseSwitchError(err: unknown): string {
  if (err instanceof ApiResponseError) {
    if (err.code === 'pin_locked') return 'Too many attempts — try again in 5 minutes'
    if (err.code === 'invalid_pin') return 'Incorrect PIN'
  }
  return 'Something went wrong'
}
