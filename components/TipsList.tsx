import { IconArrowRight, IconStar, IconWarning } from '@/components/icons'

interface Props {
  tips: string[]
  platforms: string[]
  keywords: string[]
  watchOut: string
}

const CARD = 'bg-gradient-to-b from-slate-800 to-slate-800/60 border border-slate-700/40 rounded-2xl p-4 shadow-[0_1px_3px_rgb(0_0_0/0.4),0_4px_12px_rgb(0_0_0/0.25)]'
const SECTION_HEADER = 'text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2'

export function TipsList({ tips, platforms, keywords, watchOut }: Props) {
  return (
    <div className="space-y-3">

      {/* Platforms + tips */}
      <div className={`${CARD} space-y-4`}>

        <div>
          <h3 className={SECTION_HEADER}>Best Platforms</h3>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p, i) => (
              <span
                key={p}
                className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                  i === 0
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10 font-bold'
                    : 'bg-slate-700/60 border border-slate-600/40 text-slate-300'
                }`}
              >
                {i === 0 && <IconStar size={9} className="text-amber-400 shrink-0" />}
                {p}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className={SECTION_HEADER}>Selling Tips</h3>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                <IconArrowRight size={14} className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                {tip}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className={`${CARD} space-y-2`}>
          <h3 className={SECTION_HEADER}>Listing Keywords</h3>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span
                key={k}
                className="bg-slate-700/40 border border-slate-600/40 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono hover:border-amber-500/30 hover:text-amber-200 transition-colors cursor-pointer"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Watch out */}
      {watchOut && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-4 space-y-1.5">
          <h3 className="text-red-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
            <IconWarning size={12} className="text-red-400" />
            Watch Out
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">{watchOut}</p>
        </div>
      )}

    </div>
  )
}
