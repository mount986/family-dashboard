import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiResponseError } from '@/api/client'
import { profileKeys } from '@/api/profiles'
import { useSessionStore } from '@/store/session'
import type { ActiveSession, Profile } from '@family-dashboard/types'

export function BootstrapScreen() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const qc = useQueryClient()
  const setSession = useSessionStore((s) => s.setSession)

  const bootstrap = useMutation({
    mutationFn: (body: { name: string; pin: string }) =>
      api.post<{ profile: Profile; session: ActiveSession }>('/bootstrap', body),
    onSuccess: ({ session }) => {
      setSession(session)
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
      qc.invalidateQueries({ queryKey: profileKeys.all })
      qc.invalidateQueries({ queryKey: profileKeys.session })
    },
  })

  function validate(): string | null {
    if (!name.trim()) return 'Name is required'
    if (pin.length < 4) return 'PIN must be at least 4 digits'
    if (pin !== confirmPin) return 'PINs do not match'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    try {
      await bootstrap.mutateAsync({ name: name.trim(), pin })
    } catch (err) {
      setError(err instanceof ApiResponseError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Family Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2">Create your admin profile to get started</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="e.g. Mom, Dad, Alex"
                autoFocus
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Admin PIN
              </label>
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
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Repeat PIN"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={bootstrap.isPending}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 disabled:opacity-40 transition-colors mt-2"
            >
              {bootstrap.isPending ? 'Creating…' : 'Create admin profile'}
            </button>
          </form>

          <p className="text-slate-600 text-xs text-center mt-4">
            This screen only appears once. Keep your PIN safe — it's required to manage profiles.
          </p>
        </div>
      </div>
    </div>
  )
}
