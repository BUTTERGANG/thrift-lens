'use client'

// Carries captured-photo thumbnails from the scanner into result/history cards
// entirely in-browser (session-scoped, so the photo never round-trips to the
// server for a thumbnail — respecting the "images are not stored" privacy line).
// sessionStorage survives same-tab navigation, which is exactly the path a scan
// takes: home → /results/<id> → /history in the same tab.

const KEY = 'thriftlens_thumbs'

export type ThumbMap = Record<string, string> // key: scan id (or 'preview') → data URL

export function getThumbs(): ThumbMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ThumbMap) : {}
  } catch {
    return {}
  }
}

export function saveThumb(key: string, dataUrl: string | null): void {
  if (typeof window === 'undefined') return
  const thumbs = getThumbs()
  if (dataUrl) {
    thumbs[key] = dataUrl
  } else {
    delete thumbs[key]
  }
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(thumbs))
  } catch {
    // Quota or storage blocked — thumbnails are a nice-to-have.
  }
}