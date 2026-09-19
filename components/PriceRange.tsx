interface Props {
  low: number
  high: number
  profitLow: number
  profitHigh: number
  suggestedList: number
}

function usd(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function PriceRange({ low, high, profitLow, profitHigh, suggestedList }: Props) {
  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-800/60 border border-slate-700/40 rounded-2xl p-4 space-y-4 shadow-[0_1px_3px_rgb(0_0_0/0.4),0_4px_12px_rgb(0_0_0/0.25)]">
      <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
        Market Value
      </h3>

      {/* Range bar */}
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[44px]">
          <p className="text-slate-500 text-xs mb-0.5">Low</p>
          <p className="text-slate-300 font-semibold text-sm">{usd(low)}</p>
        </div>
        <div className="flex-1 h-3 bg-slate-700/80 rounded-full overflow-hidden shadow-inner">
          <div className="h-full w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-green-500 rounded-full" />
        </div>
        <div className="text-center min-w-[44px]">
          <p className="text-slate-500 text-xs mb-0.5">High</p>
          <p className="text-white font-black text-base">{usd(high)}</p>
        </div>
      </div>

      {/* List price + profit grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-700/40 border border-slate-600/40 rounded-xl p-3">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Suggested List</p>
          <p className="text-white font-bold text-base">{usd(suggestedList)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-700/40 rounded-xl p-3 shadow-md shadow-green-900/20">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Est. Profit</p>
          <p className="text-green-400 font-black text-base [text-shadow:0_0_12px_rgb(34_197_94/0.4)]">
            {usd(profitLow)} – {usd(profitHigh)}
          </p>
        </div>
      </div>

      <p className="text-slate-400 text-xs">
        After ~13% eBay fees + est. shipping
      </p>
    </div>
  )
}
