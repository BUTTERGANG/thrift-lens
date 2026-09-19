import type { ScanResponse } from '@/types'
import { DealScore } from './DealScore'
import { PriceRange } from './PriceRange'
import { CompsList } from './CompsList'
import { TipsList } from './TipsList'
import { ShareButton } from './ShareButton'
import {
  IconCamera, IconSearch, IconBarChart, IconDollar,
  IconClipboard, IconPin, IconStar, IconInbox,
} from '@/components/icons'
import type { ReactNode } from 'react'

interface Props {
  scan: ScanResponse
  /** Data-URL thumbnail of the captured photo, carried client-side (never uploaded). */
  thumbnail?: string | null
}

const CONDITION_LABEL: Record<string, string> = {
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

const CATEGORY_ICON: Record<string, ReactNode> = {
  clothing:      <IconCamera size={18} className="text-slate-400" />,
  electronics:   <IconSearch size={18} className="text-slate-400" />,
  collectibles:  <IconStar size={18} className="text-slate-400" />,
  books:         <IconClipboard size={18} className="text-slate-400" />,
  housewares:    <IconInbox size={18} className="text-slate-400" />,
  toys:          <IconStar size={18} className="text-slate-400" />,
  sporting_goods: <IconBarChart size={18} className="text-slate-400" />,
  jewelry:       <IconDollar size={18} className="text-slate-400" />,
  furniture:     <IconPin size={18} className="text-slate-400" />,
  art:           <IconSearch size={18} className="text-slate-400" />,
  other:         <IconInbox size={18} className="text-slate-400" />,
}

const CARD = 'bg-gradient-to-b from-slate-800 to-slate-800/70 border border-slate-700/40 rounded-2xl shadow-[0_1px_3px_rgb(0_0_0/0.4),0_4px_12px_rgb(0_0_0/0.25)]'

export function ResultCard({ scan, thumbnail }: Props) {
  const { analysis, identification, comps } = scan

  const categoryIcon = CATEGORY_ICON[identification.category] ?? CATEGORY_ICON.other
  const conditionLabel = CONDITION_LABEL[identification.condition] ?? identification.condition

  const dealBg =
    analysis.deal_score === 'HOT'
      ? 'bg-gradient-to-b from-red-950/40 to-slate-800/80 border-red-800/40'
      : analysis.deal_score === 'GOOD'
      ? 'bg-gradient-to-b from-amber-950/30 to-slate-800/80 border-amber-800/30'
      : 'bg-slate-800/70 border-slate-700/40'

  return (
    <div className="space-y-3">

      {/* Captured-photo thumbnail — carried in-session, never stored on the server */}
      {thumbnail && (
        <div className="rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-800/60 shadow-[0_1px_3px_rgb(0_0_0/0.3),0_4px_12px_rgb(0_0_0/0.2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail} alt={`Photo of ${identification.item_name}`} className="w-full max-h-80 object-cover" />
        </div>
      )}

      {/* Item header */}
      <div className={`${CARD} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {categoryIcon}
              {identification.brand && (
                <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {identification.brand}
                </span>
              )}
            </div>
            <h2 className="text-white font-black text-xl leading-snug [text-shadow:0_1px_3px_rgb(0_0_0/0.4)]">
              {identification.item_name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="bg-slate-700/60 border border-slate-600/40 text-slate-300 text-xs px-2.5 py-0.5 rounded-full">
                {conditionLabel}
              </span>
              {identification.estimated_era && (
                <span className="bg-slate-700/60 border border-slate-600/40 text-slate-300 text-xs px-2.5 py-0.5 rounded-full">
                  {identification.estimated_era}
                </span>
              )}
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                identification.confidence === 'high'
                  ? 'bg-green-900/40 border-green-700/40 text-green-400'
                  : identification.confidence === 'medium'
                  ? 'bg-amber-900/40 border-amber-700/40 text-amber-400'
                  : 'bg-slate-700/60 border-slate-600/40 text-slate-400'
              }`}>
                {identification.confidence} confidence
              </span>
            </div>
            {identification.condition_notes && (
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                {identification.condition_notes}
              </p>
            )}
          </div>
          <ShareButton
            title={identification.item_name}
            text={`${identification.item_name} — ${analysis.deal_score} deal on ThriftLens`}
          />
        </div>

        {identification.notable_features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-700/40">
            {identification.notable_features.map((f) => (
              <span key={f} className="bg-slate-700/40 border border-slate-600/30 text-slate-400 text-xs px-2.5 py-0.5 rounded-full hover:border-amber-500/30 hover:text-slate-300 transition-colors">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Deal score */}
      <div className={`border rounded-2xl p-5 flex flex-col items-center gap-3 ${dealBg}`}>
        <DealScore score={analysis.deal_score} reason={analysis.deal_score_reason} size="lg" />
        <p className="text-slate-400 text-xs text-center">
          Data confidence: <span className="text-slate-500">{analysis.data_confidence}</span>
        </p>
      </div>

      {/* Price + profit */}
      <PriceRange
        low={analysis.market_value_low}
        high={analysis.market_value_high}
        profitLow={analysis.profit_estimate_low}
        profitHigh={analysis.profit_estimate_high}
        suggestedList={analysis.suggested_list_price}
      />

      {/* eBay comps */}
      <CompsList comps={comps} />

      {/* Tips, platforms, keywords */}
      <TipsList
        tips={analysis.selling_tips}
        platforms={analysis.best_platforms}
        keywords={analysis.keywords_for_listing}
        watchOut={analysis.watch_out_for}
      />

    </div>
  )
}
