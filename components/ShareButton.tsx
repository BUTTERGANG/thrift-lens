'use client'

import { useState } from 'react'

interface Props {
  title: string
  text: string
}

export function ShareButton({ title, text }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    // Try native share first (works on iPhone)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: window.location.href })
        return
      } catch (err) {
        // AbortError = user cancelled — that's fine, don't fall through
        if (err instanceof Error && err.name === 'AbortError') return
        // Other errors fall through to clipboard
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard also unavailable — nothing to do
    }
  }

  return (
    <button
      onClick={handleShare}
      className="shrink-0 w-9 h-9 bg-slate-700/80 border border-slate-600/50 hover:border-slate-500 hover:bg-slate-700 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 shadow-sm"
      aria-label={copied ? 'Link copied!' : 'Share'}
      title={copied ? 'Link copied!' : 'Share'}
    >
      {copied ? (
        <span className="text-green-400 text-xs font-bold">✓</span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      )}
    </button>
  )
}
