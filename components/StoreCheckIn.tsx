'use client'

import { useEffect, useState } from 'react'
import {
  getCheckIn,
  setCheckIn,
  clearCheckIn,
  getCurrentPosition,
  reverseGeocode,
  type CheckIn,
} from '@/lib/location'
import { IconPin } from '@/components/icons'

type Mode = 'idle' | 'detecting' | 'confirm' | 'checked_in'

const BTN_AMBER = 'flex-1 py-2.5 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 text-sm font-bold rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-40 active:scale-[0.96] active:from-amber-500 active:to-amber-600 transition-all duration-150'
const INPUT = 'w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70 focus:bg-slate-900 focus:shadow-[0_0_0_3px_rgb(245_158_11/0.12)] transition-all duration-150'

export function StoreCheckIn() {
  const [mode, setMode] = useState<Mode>('idle')
  const [checkin, setCheckinState] = useState<CheckIn | null>(null)
  const [suggestedName, setSuggestedName] = useState('')
  const [editedName, setEditedName] = useState('')
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    const existing = getCheckIn()
    if (existing) {
      setCheckinState(existing)
      setMode('checked_in')
    }
  }, [])

  async function handleDetect() {
    setGeoError(null)
    setMode('detecting')
    try {
      const pos = await getCurrentPosition()
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      setPendingCoords({ lat, lon })

      let name = ''
      try {
        name = await reverseGeocode(lat, lon)
      } catch {
        name = 'Thrift Store'
      }
      setSuggestedName(name)
      setEditedName(name)
      setMode('confirm')
    } catch (err) {
      const msg = err instanceof GeolocationPositionError
        ? err.code === 1
          ? 'Location permission denied. Enter store name manually.'
          : 'Could not get location. Enter store name manually.'
        : 'Location unavailable. Enter store name manually.'
      setGeoError(msg)
      setEditedName('')
      setMode('confirm')
    }
  }

  function handleConfirm() {
    const name = editedName.trim()
    if (!name) return
    const saved = setCheckIn({
      store_name: name,
      latitude: pendingCoords?.lat ?? 0,
      longitude: pendingCoords?.lon ?? 0,
    })
    setCheckinState(saved)
    setMode('checked_in')
    setGeoError(null)
  }

  function handleClear() {
    clearCheckIn()
    setCheckinState(null)
    setSuggestedName('')
    setEditedName('')
    setPendingCoords(null)
    setGeoError(null)
    setMode('idle')
  }

  if (mode === 'checked_in' && checkin) {
    return (
      <div className="flex items-center justify-between bg-slate-800/60 border border-amber-500/20 rounded-2xl px-4 py-2.5 mb-4 shadow-sm shadow-amber-500/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <IconPin size={15} strokeWidth={2} className="text-amber-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium leading-tight truncate">{checkin.store_name}</p>
            <p className="text-slate-500 text-xs">Scans will be tagged to this store</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-300 text-xs ml-3 shrink-0 transition-colors"
        >
          Leave
        </button>
      </div>
    )
  }

  if (mode === 'detecting') {
    return (
      <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 mb-4">
        <IconPin size={15} strokeWidth={2} className="text-amber-500 shrink-0 animate-pulse" />
        <p className="text-slate-400 text-sm">Getting your location…</p>
      </div>
    )
  }

  if (mode === 'confirm') {
    return (
      <div className="bg-slate-800/70 border border-slate-700/40 rounded-2xl px-4 py-4 mb-4 space-y-3 shadow-[0_1px_3px_rgb(0_0_0/0.4),0_4px_12px_rgb(0_0_0/0.25)]">
        <p className="text-slate-300 text-sm font-medium">
          {suggestedName ? 'Confirm store name' : 'Enter store name'}
        </p>
        {geoError && (
          <p className="text-slate-500 text-xs">{geoError}</p>
        )}
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          placeholder="e.g. Goodwill — Main St"
          className={INPUT}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={!editedName.trim()}
            className={BTN_AMBER}
          >
            Check in
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2.5 bg-slate-700/60 border border-slate-600/40 text-slate-300 text-sm rounded-xl hover:bg-slate-700 active:scale-[0.96] transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleDetect}
      className="group w-full flex items-center gap-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 mb-4 hover:border-amber-500/40 hover:bg-white/10 transition-all duration-300 active:scale-[0.98] shadow-sm"
    >
      <IconPin size={15} strokeWidth={2} className="text-slate-400 group-hover:text-amber-400/90 shrink-0 transition-colors duration-200" />
      <p className="text-slate-300 text-sm font-medium tracking-wide">Set store location to track deals by store</p>
    </button>
  )
}
