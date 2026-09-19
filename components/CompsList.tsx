import type { EbayComp } from '@/types'
import { IconArrowUpRight } from '@/components/icons'

interface Props {
  comps: EbayComp[]
}

export function CompsList({ comps }: Props) {
  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-800/60 border border-slate-700/40 rounded-2xl p-4 space-y-3 shadow-[0_1px_3px_rgb(0_0_0/0.4),0_4px_12px_rgb(0_0_0/0.25)]">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
          eBay Active Listings
        </h3>
        <span className="text-slate-600 text-xs">
          {comps.length > 0 ? `${comps.length} found` : 'none found'}
        </span>
      </div>

      {comps.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No active listings found — pricing based on AI market knowledge.
        </p>
      ) : (
        <div className="space-y-2">
          {comps.map((comp, i) => (
            <a
              key={i}
              href={comp.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700/20 hover:border-slate-600/40 rounded-xl p-3 transition-all duration-150 active:scale-[0.98]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm leading-snug line-clamp-2">{comp.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{comp.condition}</p>
              </div>
              <div className="shrink-0 text-right flex flex-col items-end gap-1">
                <p className="text-amber-400 font-bold text-sm">${comp.price.toFixed(2)}</p>
                <IconArrowUpRight size={13} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="text-slate-400 text-xs">
        Active listings show asking prices. Sold data isn&apos;t publicly available via the eBay API.
      </p>
    </div>
  )
}
