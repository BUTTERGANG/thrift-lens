'use client'

import { useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ResultCardWithThumb } from '@/components/ResultCardWithThumb'
import { AppNav } from '@/components/AppNav'
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
      <div className="max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto px-4 pt-5 lg:pt-20 pb-32 lg:pb-12">
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← New Scan
          </Link>
          <span className="text-amber-600 text-xs bg-amber-900/30 border border-amber-800/40 px-2 py-0.5 rounded-full">
            Preview — not saved
          </span>
        </div>

        <ResultCardWithThumb scan={scan} id={scan.scan_id ? String(scan.scan_id) : 'preview'} />
      </div>

      {/* Responsive nav (bottom on mobile, top bar on desktop) */}
      <AppNav active="scan" />
    </main>
  )
}
