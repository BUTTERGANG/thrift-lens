'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCheckIn } from '@/lib/location'
import { isHeic, toUploadableImage } from '@/lib/image'
import { IconCamera, IconGallery, IconArrowRight, IconCheck, IconWarning } from '@/components/icons'

const STEPS = ['Identify', 'Comps', 'Analysis']

export function Scanner() {
  // Two separate inputs: iOS Safari only offers the camera when `capture` is a
  // real attribute at parse time (toggling it via setAttribute is unreliable),
  // and it needs `accept="image/*"` rather than an explicit type list.
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    if (!picked) return
    if (!picked.type.startsWith('image/') && !isHeic(picked)) {
      setError('Please select an image file.')
      return
    }

    setError(null)

    // Try to convert HEIC → JPEG and downscale big camera photos in the browser
    // (fast, hardware-decoded on iOS/Safari). If the browser can't decode it
    // — HEIC on desktop Chrome/Firefox — fall through with the original file
    // and let the server convert it.
    let f = picked
    try {
      f = await toUploadableImage(picked)
    } catch {
      // Browser couldn't decode it (HEIC on Chrome/Firefox, or an odd format).
      // Send the original through — the server sniffs the header and converts
      // HEIC there, and rejects anything it genuinely can't use.
      f = picked
    }

    if (f.size > 10 * 1024 * 1024) {
      setError('Image too large. Max 10MB.')
      return
    }

    setFile(f)
    if (preview) URL.revokeObjectURL(preview)
    // A still-HEIC file won't render in <img> on non-Safari browsers; skip the
    // object URL so the preview falls back to the "photo selected" card.
    setPreview(isHeic(f) ? null : URL.createObjectURL(f))
  }

  function openCamera() {
    const el = cameraInputRef.current
    if (!el) return
    el.value = ''
    el.click()
  }

  function openLibrary() {
    const el = libraryInputRef.current
    if (!el) return
    el.value = ''
    el.click()
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFile(null)
    setError(null)
  }

  async function handleScan() {
    if (!file) return
    setLoading(true)
    setStepIndex(0)
    setError(null)

    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
    }, 6000)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const checkin = getCheckIn()
      if (checkin) {
        formData.append('store_name', checkin.store_name)
        formData.append('latitude', String(checkin.latitude))
        formData.append('longitude', String(checkin.longitude))
      }

      const res = await fetch('/api/scan', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Scan failed')

      sessionStorage.setItem('thriftlens_preview', JSON.stringify(data))

      if (data.scan_id) {
        router.push(`/results/${data.scan_id}`)
      } else {
        router.push('/results/preview')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Take a photo"
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Choose an image from your library"
      />

      {/* Preview / drop zone */}
      {file ? (
        <div className="rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/40">
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt="Selected item"
              className="w-full object-cover max-h-72"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <IconCheck size={28} strokeWidth={2.5} className="text-green-400" />
              <p className="text-slate-200 text-sm font-semibold">Photo selected</p>
              <p className="text-slate-500 text-xs px-6">
                HEIC preview isn&apos;t supported in this browser — it&apos;ll be converted when you scan.
              </p>
            </div>
          )}
          {!loading && (
            <div className="flex gap-2 p-3 bg-slate-900/70">
              <button
                onClick={openCamera}
                className="flex-1 py-2.5 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-[0.96] active:from-amber-500 active:to-amber-600 transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <IconCamera size={13} strokeWidth={2.5} />
                Retake
              </button>
              <button
                onClick={() => { reset(); openLibrary() }}
                className="flex-1 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold rounded-xl text-xs active:scale-[0.96] transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <IconGallery size={13} strokeWidth={2.5} />
                Choose different
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={openCamera}
          className="group w-full border border-white/10 rounded-2xl h-52 flex flex-col items-center justify-center gap-3 bg-white/5 backdrop-blur-md hover:border-amber-500/40 hover:bg-white/10 transition-all duration-300 active:scale-[0.98] shadow-xl"
        >
          <IconCamera size={44} strokeWidth={1.25} className="text-slate-400 group-hover:text-amber-400/90 transition-colors duration-200 drop-shadow-md" />
          <div className="text-center">
            <p className="text-slate-200 text-sm font-semibold tracking-wide">Tap to take a photo</p>
            <p className="text-slate-400 text-xs mt-1">or choose from your library below</p>
          </div>
        </button>
      )}

      {/* Action buttons */}
      {!loading && !file && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={openCamera}
              className="flex-1 py-3 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold rounded-2xl text-sm shadow-lg shadow-amber-500/25 active:shadow-amber-500/10 active:scale-[0.96] active:from-amber-500 active:to-amber-600 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <IconCamera size={16} strokeWidth={2.5} />
              Take Photo
            </button>
            <button
              onClick={openLibrary}
              className="flex-1 py-3 bg-slate-700/80 border border-slate-600 hover:border-slate-500 hover:bg-slate-600 text-white font-semibold rounded-2xl text-sm active:scale-[0.96] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
            >
              <IconGallery size={16} strokeWidth={2} />
              Library
            </button>
          </div>
          <p className="text-slate-400 text-xs text-center font-medium mt-1">
            Best results: bright light, fill the frame, and avoid glare.
          </p>
        </div>
      )}

      {/* Scan button */}
      {file && !loading && (
        <button
          onClick={handleScan}
          className="w-full py-4 bg-gradient-to-b from-green-400 to-green-600 text-white font-black rounded-2xl text-base tracking-wide shadow-xl shadow-green-500/30 active:shadow-green-500/10 active:scale-[0.96] active:from-green-500 active:to-green-700 transition-all duration-150"
        >
          <span className="flex items-center justify-center gap-2">
            Scan for Value
            <IconArrowRight size={17} strokeWidth={2.5} />
          </span>
        </button>
      )}

      {/* Loading state */}
      {loading && (
        <div className="w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-800/80">
          {/* Amber progress sweep bar */}
          <div className="h-1 w-full bg-slate-700 relative overflow-hidden">
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-400 to-transparent [animation:progress-sweep_1.8s_ease-in-out_infinite]" />
          </div>

          <div className="p-4 space-y-4">
            {/* Step indicators */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={[
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-500',
                    index < stepIndex
                      ? 'bg-amber-500 border-amber-400 text-slate-900'
                      : index === stepIndex
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-600',
                  ].join(' ')}>
                    {index < stepIndex
                      ? <IconCheck size={11} strokeWidth={3} />
                      : <span>{index + 1}</span>
                    }
                  </div>
                  <span className={[
                    'text-xs transition-colors duration-300',
                    index === stepIndex ? 'text-slate-200 font-semibold' : 'text-slate-600',
                  ].join(' ')}>
                    {step}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={[
                      'w-6 h-px mx-1 transition-colors duration-500',
                      index < stepIndex ? 'bg-amber-500/50' : 'bg-slate-700',
                    ].join(' ')} />
                  )}
                </div>
              ))}
            </div>

            {/* Shimmer skeleton lines */}
            <div className="space-y-2">
              <div className="h-3 shimmer rounded-full w-2/3" />
              <div className="h-3 shimmer rounded-full w-1/2" />
            </div>

            <p className="text-slate-600 text-xs text-center">Typically 15–25 seconds</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="bg-red-950/50 border border-red-800 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2"
        >
          <IconWarning size={15} className="shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
