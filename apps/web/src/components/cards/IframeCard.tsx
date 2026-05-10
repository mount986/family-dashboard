import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Card, IframeCardConfig } from '@family-dashboard/types'
import { api } from '@/api/client'

interface ResolveResult {
  finalUrl: string
  canEmbed: boolean
}

function useResolvedUrl(url: string | undefined) {
  return useQuery({
    queryKey: ['iframe-resolve', url],
    queryFn: () => api.get<ResolveResult>(`/iframe/resolve?url=${encodeURIComponent(url!)}`),
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

interface IframeCardProps {
  card: Card
}

export function IframeCard({ card }: IframeCardProps) {
  const config = card.config as Partial<IframeCardConfig>
  const configuredUrl = config.url?.trim()
  const [iframeLoading, setIframeLoading] = useState(true)

  const { data: resolved, isLoading: resolving } = useResolvedUrl(configuredUrl)

  if (!configuredUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-3xl">🔗</span>
        <p className="text-slate-300 text-sm font-medium">No URL set</p>
        <p className="text-slate-500 text-xs leading-relaxed">
          Open settings (⚙ in edit mode) and paste a website URL to display it here.
        </p>
      </div>
    )
  }

  if (resolving) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const finalUrl = resolved?.finalUrl ?? configuredUrl
  const canEmbed = resolved?.canEmbed ?? true

  if (!canEmbed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-3xl">🚫</span>
        <p className="text-slate-300 text-sm font-medium">Embedding blocked</p>
        <p className="text-slate-500 text-xs leading-relaxed">
          This site does not allow embedding. You can still open it in a new tab.
        </p>
        <a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          Open in new tab ↗
        </a>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-slate-950">
      {iframeLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}
      <iframe
        key={finalUrl}
        src={finalUrl}
        title={card.title}
        className="w-full h-full border-0"
        allow="fullscreen; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setIframeLoading(false)}
      />
    </div>
  )
}
