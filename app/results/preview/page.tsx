'use client'

import { useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ResultCard } from '@/components/ResultCard'
import type { ScanResponse } from '@/types'

export default function PreviewPage() {
  const snapshot = useSyncExternalStore(
    () => () => {},
    () => (typeof window === 'undefined' ? null : sessionStorage.getItem('thriftlens_preview')),
    () => null
  )

  const { scan, error } = useMemo(() => {
    if (!snapshot) return { scan: null as ScanResponse | null, error: true }
    try {
      return { scan: JSON.parse(snapshot) as ScanResponse, error: false }
    } catch {
      return { scan: null, error: true }
    }
  }, [snapshot])

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-4xl">😕</span>
        <p className="text-slate-400 text-center">Scan result not found.</p>
        <Link href="/" className="px-6 py-3 bg-amber-500 text-black font-bold rounded-2xl text-sm">
          Try Again
        </Link>
      </main>
    )
  }

  if (!scan) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28">
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← New Scan
          </Link>
          <span className="text-amber-600 text-xs bg-amber-900/30 border border-amber-800/40 px-2 py-0.5 rounded-full">
            Preview — not saved
          </span>
        </div>

        <ResultCard scan={scan} />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link href="/" className="flex-1 py-4 flex flex-col items-center gap-0.5 text-slate-500">
          <span className="text-lg">📸</span>
          <span className="text-xs">Scan</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 flex flex-col items-center gap-0.5 text-slate-500">
          <span className="text-lg">🕐</span>
          <span className="text-xs">History</span>
        </Link>
      </nav>
    </main>
  )
}
