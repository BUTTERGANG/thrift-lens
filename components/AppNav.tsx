import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { IconCamera, IconClock, IconSearch } from './icons'

interface Props {
  active: 'scan' | 'history'
}

/**
 * Responsive nav that adapts to device width:
 *  - Mobile (<1024px): the familiar fixed bottom glass bar — Scan · History · theme toggle.
 *  - Desktop (≥1024px): a fixed top glass bar with the brand + primary links + theme
 *    toggle, so the bottom of the screen isn't a sparse full-width strip.
 * The show/hide switch uses plain CSS media queries in globals.css (data-nav hooks)
 * rather than Tailwind's `lg:` prefixes, which can be emitted in a way some
 * browsers don't apply. Pages add top padding on desktop to clear the bar.
 */
export function AppNav({ active }: Props) {
  const scanActive = active === 'scan'
  const historyActive = active === 'history'

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        data-nav="mobile"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Link href="/" className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs ${scanActive ? 'text-amber-400 font-semibold relative' : 'text-slate-500 hover:text-slate-300'}`}>
          {scanActive ? <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" /> : null}
          <IconCamera size={20} strokeWidth={1.75} />
          <span>Scan</span>
        </Link>
        <Link href="/history" className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs ${historyActive ? 'text-amber-400 font-semibold relative' : 'text-slate-500 hover:text-slate-300'}`}>
          {historyActive ? <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" /> : null}
          <IconClock size={20} strokeWidth={1.75} />
          <span>History</span>
        </Link>
        <div className="flex items-center justify-center px-2">
          <ThemeToggle />
        </div>
      </nav>

      {/* Desktop top nav */}
      <nav
        data-nav="desktop"
        className="fixed top-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 items-center gap-1"
      >
        <Link href="/" className="flex items-center gap-2 px-4 py-3 hover:opacity-90">
          <IconSearch size={18} strokeWidth={2.25} className="text-amber-400" />
          <span className="font-black tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            ThriftLens
          </span>
        </Link>
        <div className="flex-1" />
        <Link
          href="/"
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${scanActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Scan
        </Link>
        <Link
          href="/history"
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${historyActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          History
        </Link>
        <div className="px-1">
          <ThemeToggle />
        </div>
      </nav>
    </>
  )
}