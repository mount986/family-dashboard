import { useState } from 'react'
import type { Card, IframeCardConfig } from '@family-dashboard/types'

interface IframeCardProps {
  card: Card
}

export function IframeCard({ card }: IframeCardProps) {
  const config = card.config as Partial<IframeCardConfig>
  const url = config.url?.trim()
  const [loading, setLoading] = useState(true)

  if (!url) {
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

  return (
    <div className="relative w-full h-full bg-slate-950">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}
      <iframe
        key={url}
        src={url}
        title={card.title}
        className="w-full h-full border-0"
        allow="fullscreen; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}
