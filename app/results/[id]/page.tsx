import { notFound } from 'next/navigation'
import Link from 'next/link'
import sql from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { ResultCardWithThumb } from '@/components/ResultCardWithThumb'
import { AppNav } from '@/components/AppNav'
import { FeedbackTap } from '@/components/FeedbackTap'
import { IconArrowLeft } from '@/components/icons'
import type { ScanRecord, ScanResponse } from '@/types'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await requireSession()

  const rows = await sql`
    SELECT * FROM scans WHERE id = ${id}::uuid AND user_id = ${session.userId}::uuid LIMIT 1
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
      <div className="max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto px-4 pt-5 lg:pt-20 pb-32 lg:pb-12">

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

        <ResultCardWithThumb scan={scanResponse} id={record.id} />

        {record.bought === null && (
          <FeedbackTap scanId={record.id} dealScore={record.deal_score} />
        )}

      </div>

      {/* Responsive nav (bottom on mobile, top bar on desktop) */}
      <AppNav active="scan" />
    </main>
  )
}
