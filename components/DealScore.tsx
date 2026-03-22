import { IconFlame, IconThumbUp, IconMinus } from '@/components/icons'

interface Props {
  score: 'HOT' | 'GOOD' | 'PASS'
  reason?: string
  size?: 'sm' | 'lg'
}

const config = {
  HOT: {
    badge: 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white font-black tracking-wide rounded-full border border-red-400/30 [animation:hot-pulse_2s_ease-in-out_infinite]',
    icon: IconFlame,
    label: 'HOT DEAL',
  },
  GOOD: {
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-bold tracking-wide rounded-full border border-amber-400/20 shadow-lg shadow-amber-500/20',
    icon: IconThumbUp,
    label: 'GOOD DEAL',
  },
  PASS: {
    badge: 'bg-slate-700/80 text-slate-400 font-semibold tracking-wide rounded-full border border-slate-600/50',
    icon: IconMinus,
    label: 'PASS',
  },
}

export function DealScore({ score, reason, size = 'lg' }: Props) {
  const { badge, icon: Icon, label } = config[score]
  const sizing = size === 'lg' ? 'text-base px-5 py-2.5 gap-2' : 'text-xs px-3 py-1 gap-1.5'
  const iconSize = size === 'lg' ? 15 : 11

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`inline-flex items-center ${sizing} ${badge}`}>
        <Icon size={iconSize} strokeWidth={size === 'lg' ? 2 : 2.5} />
        {label}
      </span>
      {reason && size === 'lg' && (
        <p className="text-slate-400 text-sm text-center max-w-xs leading-relaxed">{reason}</p>
      )}
    </div>
  )
}
