import { Scanner } from '@/components/Scanner'
import { StoreCheckIn } from '@/components/StoreCheckIn'
import { UserMenu } from '@/components/UserMenu'
import { AppNav } from '@/components/AppNav'
import { getSession } from '@/lib/auth'
import { IconSearch, IconBarChart, IconDollar, IconClipboard } from '@/components/icons'
import type { ReactNode } from 'react'

const FEATURES: { icon: ReactNode; label: string }[] = [
  { icon: <IconSearch size={12} strokeWidth={2} />, label: 'AI Identify' },
  { icon: <IconBarChart size={12} strokeWidth={2} />, label: 'Live Comps' },
  { icon: <IconDollar size={12} strokeWidth={2} />, label: 'Profit Score' },
  { icon: <IconClipboard size={12} strokeWidth={2} />, label: 'Sell Tips' },
]

export default async function Home() {
  const session = await getSession()

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto px-4 pt-10 lg:pt-24 pb-32 lg:pb-12">

        {/* User menu */}
        {session && (
          <div className="flex justify-end mb-2">
            <UserMenu username={session.username} />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-4 hover:scale-105 transition-transform duration-300">
            <IconSearch size={28} strokeWidth={2.5} className="text-amber-400" />
            <h1 className="text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Thrift
              </span>
              <span className="text-white">Lens</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Snap any item. Know its worth in 20 seconds.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex justify-center gap-2.5 flex-wrap mb-10">
          {FEATURES.map((f, index) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 text-slate-300 text-xs px-3.5 py-1.5 rounded-full hover:border-amber-500/40 hover:bg-white/10 hover:text-white transition-all duration-300 shadow-sm"
              style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s both` }}
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>


        {/* Store check-in */}
        <StoreCheckIn />

        {/* Scanner */}
        <Scanner />

        {/* How it works (Moved below scanner) */}
        <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg">
          <h2 className="text-slate-200 text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            How it works
          </h2>
          <ol className="space-y-3.5 text-slate-400 text-sm">
            {[
              'Take a photo or upload from your library.',
              'AI identifies the item and pulls live comps.',
              'Get a market range, profit estimate, and tips.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <p className="text-slate-500 text-xs mt-4 pt-4 border-t border-slate-700/50">
            Privacy: images are not stored on our servers.
          </p>
        </div>

        {/* Divider + trust line */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-slate-600 text-xs">
            Claude AI · eBay market data
          </p>
        </div>

      </div>

      {/* Responsive nav (bottom on mobile, top bar on desktop) */}
      <AppNav active="scan" />
    </main>
  )
}
