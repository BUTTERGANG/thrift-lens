'use client'

import { useState } from 'react'
import { IconCheck, IconX } from '@/components/icons'

type Step = 'buy_decision' | 'details' | 'done'

interface Props {
  scanId: string
  dealScore: 'HOT' | 'GOOD' | 'PASS'
}

const CARD = 'mt-4 rounded-2xl bg-slate-800/60 border border-slate-700/40 px-4 py-4 shadow-[0_1px_3px_rgb(0_0_0/0.4),0_4px_12px_rgb(0_0_0/0.25)]'
const INPUT = 'w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70 focus:bg-slate-900 focus:shadow-[0_0_0_3px_rgb(245_158_11/0.12)] transition-all duration-150'
const BTN_AMBER = 'w-full py-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-40 active:scale-[0.96] active:from-amber-500 active:to-amber-600 transition-all duration-150'

export function FeedbackTap({ scanId, dealScore }: Props) {
  const [step, setStep] = useState<Step>('buy_decision')
  const [bought, setBought] = useState<boolean | null>(null)
  const [buyPriceInput, setBuyPriceInput] = useState('')
  const [idCorrect, setIdCorrect] = useState<boolean | null>(null)
  const [actualItem, setActualItem] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    const buyPriceCents = buyPriceInput
      ? Math.round(parseFloat(buyPriceInput) * 100)
      : null

    await fetch(`/api/scan/${scanId}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bought,
        buy_price_cents: buyPriceCents,
        identification_correct: idCorrect,
        actual_item_override: actualItem.trim() || null,
      }),
    })
    setSubmitting(false)
    setStep('done')
  }

  function handleBuyDecision(decision: boolean) {
    setBought(decision)
    setStep('details')
  }

  function handleSkip() {
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className={`${CARD} text-center`}>
        <p className="text-slate-400 text-sm">Thanks — this helps improve ThriftLens.</p>
      </div>
    )
  }

  if (step === 'buy_decision') {
    const prompt =
      dealScore === 'HOT' ? '🔥 Did you buy this?' :
      dealScore === 'GOOD' ? '👍 Did you buy this?' :
      'Did you buy this anyway?'

    return (
      <div className={CARD}>
        <p className="text-white text-sm font-medium mb-3 text-center">{prompt}</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleBuyDecision(true)}
            className="flex-1 py-2.5 rounded-xl bg-green-600/15 border border-green-500/40 text-green-400 text-sm font-semibold hover:bg-green-600/25 hover:border-green-500/60 active:scale-[0.96] transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <IconCheck size={13} strokeWidth={2.5} />
            Yes, bought it
          </button>
          <button
            onClick={() => handleBuyDecision(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/40 text-slate-300 text-sm font-medium hover:bg-slate-700/60 active:scale-[0.96] transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <IconX size={13} strokeWidth={2.5} />
            No, passed
          </button>
          <button
            onClick={handleSkip}
            className="px-3 py-2.5 rounded-xl text-slate-600 text-sm hover:text-slate-400 active:scale-[0.96] transition-all duration-150"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${CARD} space-y-4`}>

      {bought && (
        <div>
          <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">What did you pay? (optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={buyPriceInput}
              onChange={(e) => setBuyPriceInput(e.target.value)}
              className={`${INPUT} pl-7`}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">Was the AI identification correct?</label>
        <div className="flex gap-2">
          <button
            onClick={() => setIdCorrect(true)}
            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.96] flex items-center justify-center gap-1.5 ${
              idCorrect === true
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                : 'bg-slate-700/30 border-slate-600/40 text-slate-400 hover:border-slate-500'
            }`}
          >
            <IconCheck size={13} strokeWidth={2.5} />
            Yes
          </button>
          <button
            onClick={() => setIdCorrect(false)}
            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-[0.96] flex items-center justify-center gap-1.5 ${
              idCorrect === false
                ? 'bg-red-500/20 border-red-500/60 text-red-400'
                : 'bg-slate-700/30 border-slate-600/40 text-slate-400 hover:border-slate-500'
            }`}
          >
            <IconX size={13} strokeWidth={2.5} />
            No
          </button>
        </div>
      </div>

      {idCorrect === false && (
        <div>
          <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">What was it actually?</label>
          <input
            type="text"
            placeholder="e.g. Patagonia fleece, size L"
            value={actualItem}
            onChange={(e) => setActualItem(e.target.value)}
            className={INPUT}
          />
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || idCorrect === null}
        className={BTN_AMBER}
      >
        {submitting ? 'Saving…' : 'Submit feedback'}
      </button>
    </div>
  )
}
