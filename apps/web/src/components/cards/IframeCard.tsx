import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Card, IframeCardConfig } from '@family-dashboard/types'
import { api } from '@/api/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResolveResult {
  finalUrl: string
  canEmbed: boolean
  preview: {
    title?: string
    description?: string
    image?: string
    siteName?: string
    favicon: string
  }
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

// ── Link preview (shown when embedding is blocked) ────────────────────────────

function LinkPreview({ resolved, cardTitle }: { resolved: ResolveResult; cardTitle: string }) {
  const { finalUrl, preview } = resolved
  const title = preview.title ?? cardTitle
  const domain = (() => { try { return new URL(finalUrl).hostname.replace(/^www\./, '') } catch { return finalUrl } })()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hero image */}
      {preview.image && (
        <div className="flex-shrink-0 h-32 overflow-hidden bg-slate-800">
          <img
            src={preview.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-3 min-h-0">
        <div className="space-y-1.5 min-h-0">
          {/* Site name + favicon */}
          <div className="flex items-center gap-1.5">
            <img src={preview.favicon} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
            <span className="text-slate-500 text-[11px] truncate">{preview.siteName ?? domain}</span>
          </div>

          {/* Title */}
          <p className="text-slate-100 text-sm font-medium leading-snug line-clamp-2">{title}</p>

          {/* Description */}
          {preview.description && (
            <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{preview.description}</p>
          )}
        </div>

        {/* Open link */}
        <a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex-shrink-0"
        >
          <span>Open {domain}</span>
          <span className="text-slate-500">↗</span>
        </a>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

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

  if (!canEmbed && resolved) {
    return <LinkPreview resolved={resolved} cardTitle={card.title} />
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
