'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DealScore } from '@/components/DealScore'
import { AppNav } from '@/components/AppNav'
import { getThumbs } from '@/lib/thumbstore'
import { IconPin, IconInbox, IconWarning } from '@/components/icons'

interface HistoryItem {
  id: string
  item_identified: string
  brand: string | null
  deal_score: 'HOT' | 'GOOD' | 'PASS'
  market_value_low: number
  market_value_high: number
  store_name: string | null
  created_at: string
}

const PAGE_SIZE = 20
const RECENCY_OPTIONS = [
  { label: 'All time', value: 'all' as const },
  { label: 'Last 30 days', value: '30d' as const },
  { label: 'Last 7 days', value: '7d' as const },
]
const SCORE_OPTIONS = ['ALL', 'HOT', 'GOOD', 'PASS'] as const

type ScoreFilter = typeof SCORE_OPTIONS[number]
type RecencyFilter = typeof RECENCY_OPTIONS[number]['value']

function usd(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const FILTER_PILL_BASE = 'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150'
const FILTER_PILL_ACTIVE = 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
const FILTER_PILL_IDLE = 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:border-slate-600'

export default function HistoryPage() {
  const [scans, setScans] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('ALL')
  const [recencyFilter, setRecencyFilter] = useState<RecencyFilter>('all')

  const fetchScans = useCallback(async (currentOffset: number, append: boolean) => {
    try {
      const res = await fetch(
        `/api/history?limit=${PAGE_SIZE}&offset=${currentOffset}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const rows: HistoryItem[] = data.scans ?? []
      setScans((prev) => (append ? [...prev, ...rows] : rows))
      setHasMore(rows.length === PAGE_SIZE)
      setOffset(currentOffset + rows.length)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchScans(0, false)
  }, [fetchScans])

  function loadMore() {
    setLoadingMore(true)
    fetchScans(offset, true)
  }

  const filteredScans = scans.filter((scan) => {
    if (scoreFilter !== 'ALL' && scan.deal_score !== scoreFilter) return false
    if (recencyFilter === 'all') return true
    const now = Date.now()
    const createdAt = new Date(scan.created_at).getTime()
    const days = recencyFilter === '7d' ? 7 : 30
    return now - createdAt <= days * 24 * 60 * 60 * 1000
  })

  // Captured-photo thumbnails carried in-session (never uploaded for cards).
  const thumbs = getThumbs()

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto px-4 pt-10 lg:pt-24 pb-32 lg:pb-12">

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight">Scan History</h1>
            {scans.length > 0 && (
              <p className="text-slate-500 text-xs mt-1">
                Showing {filteredScans.length} of {scans.length}
              </p>
            )}
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all duration-150"
          >
            Scan again
          </Link>
        </div>

        {scans.length > 0 && (
          <div className="flex flex-col gap-2.5 mb-4">
            <div className="flex gap-2 flex-wrap">
              {SCORE_OPTIONS.map((score) => (
                <button
                  key={score}
                  onClick={() => setScoreFilter(score)}
                  className={`${FILTER_PILL_BASE} ${scoreFilter === score ? FILTER_PILL_ACTIVE : FILTER_PILL_IDLE}`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {RECENCY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRecencyFilter(option.value)}
                  className={`${FILTER_PILL_BASE} ${recencyFilter === option.value ? FILTER_PILL_ACTIVE : FILTER_PILL_IDLE}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shimmer skeleton loaders */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/80 border border-slate-700/40 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 shimmer rounded-full w-3/4" />
                    <div className="h-3 shimmer rounded-full w-1/2" />
                  </div>
                  <div className="h-7 w-20 shimmer rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl mt-4">
            <IconWarning size={48} strokeWidth={1.25} className="text-slate-500 mb-4 drop-shadow-md" />
            <p className="text-slate-200 font-semibold mb-1">Couldn&apos;t load history</p>
            <p className="text-slate-400 text-sm mb-6">Check your connection and try again</p>
            <button
              onClick={() => { setError(false); setLoading(true); fetchScans(0, false) }}
              className="px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold rounded-2xl text-sm shadow-md shadow-amber-500/20 active:scale-[0.97] transition-all duration-150"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && scans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl mt-4 text-balance px-4">
            <IconInbox size={48} strokeWidth={1.25} className="text-slate-500 mb-4 drop-shadow-md" />
            <p className="text-slate-200 font-semibold mb-1">No scans yet</p>
            <p className="text-slate-400 text-sm mb-6 max-w-[240px] mx-auto">
              Scan your first item to build a price history and deal scores.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold rounded-2xl text-sm shadow-md shadow-amber-500/20 active:scale-[0.97] transition-all duration-150"
            >
              Start Scanning →
            </Link>
          </div>
        )}

        {/* Scan list */}
        {!loading && !error && scans.length > 0 && (
          <div className="space-y-2">
            {filteredScans.length === 0 ? (
              <div className="bg-slate-800/80 border border-slate-700/40 rounded-2xl p-6 text-center">
                <p className="text-slate-400 text-sm mb-3">No scans match these filters.</p>
                <button
                  onClick={() => { setScoreFilter('ALL'); setRecencyFilter('all') }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredScans.map((scan) => (
                <Link
                  key={scan.id}
                  href={`/results/${scan.id}`}
                  className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-800/80 border border-slate-700/40 hover:border-slate-600/60 rounded-2xl p-4 transition-all duration-150 active:scale-[0.98] shadow-sm"
                >
                  {thumbs[scan.id] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumbs[scan.id]}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover border border-slate-600/40 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium leading-snug line-clamp-1">
                      {scan.item_identified}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {scan.brand && (
                        <span className="text-amber-400 text-xs">{scan.brand}</span>
                      )}
                      <span className="text-slate-500 text-xs">
                        {usd(scan.market_value_low)}–{usd(scan.market_value_high)}
                      </span>
                      <span className="text-slate-700 text-xs">·</span>
                      <span className="text-slate-600 text-xs">{relativeTime(scan.created_at)}</span>
                      {scan.store_name && (
                        <>
                          <span className="text-slate-700 text-xs">·</span>
                          <span className="text-slate-600 text-xs flex items-center gap-1 truncate max-w-[120px]">
                            <IconPin size={10} strokeWidth={2} className="shrink-0" />
                            {scan.store_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <DealScore score={scan.deal_score} size="sm" />
                </Link>
              ))
            )}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition-colors disabled:opacity-50 border border-slate-800 rounded-2xl hover:border-slate-700"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}

      </div>

      {/* Responsive nav (bottom on mobile, top bar on desktop) */}
      <AppNav active="history" />
    </main>
  )
}
