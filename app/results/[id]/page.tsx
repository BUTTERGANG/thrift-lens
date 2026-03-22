import { notFound } from 'next/navigation'
import Link from 'next/link'
import sql from '@/lib/db'
import { ResultCard } from '@/components/ResultCard'
import { FeedbackTap } from '@/components/FeedbackTap'
import { IconArrowLeft, IconCamera, IconClock } from '@/components/icons'
import type { ScanRecord, ScanResponse } from '@/types'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const rows = await sql`
    SELECT * FROM scans WHERE id = ${id}::uuid LIMIT 1
  `

  if (rows.length === 0) notFound()

  const record = rows[0] as ScanRecord

  const identification = record.identification_json ?? {
    item_name: record.item_identified,
    brand: record.brand,
    model: null,
    category: 'other' as const,
    condition: (record.condition as 'like_new' | 'good' | 'fair' | 'poor') ?? 'good',
    condition_notes: '',
    notable_features: [],
    estimated_era: null,
    ebay_search_query: record.item_identified,
    confidence: 'medium' as const,
  }

  const scanResponse: ScanResponse = {
    scan_id: record.id,
    item_identified: record.item_identified,
    brand: record.brand,
    deal_score: record.deal_score,
    analysis: record.analysis_json,
    identification,
    comps: record.ebay_comps_json ?? [],
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="group flex items-center gap-1.5 text-slate-500 hover:text-slate-200 text-sm transition-colors"
          >
            <IconArrowLeft size={14} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
            New Scan
          </Link>
          <span className="text-slate-600 text-xs bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/40">
            {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <ResultCard scan={scanResponse} />

        {record.bought === null && (
          <FeedbackTap scanId={record.id} dealScore={record.deal_score} />
        )}

      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link href="/" className="flex-1 py-4 flex flex-col items-center gap-0.5 text-slate-500">
          <IconCamera size={20} strokeWidth={1.75} />
          <span className="text-xs">Scan</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 flex flex-col items-center gap-0.5 text-slate-500">
          <IconClock size={20} strokeWidth={1.75} />
          <span className="text-xs">History</span>
        </Link>
      </nav>
    </main>
  )
}
