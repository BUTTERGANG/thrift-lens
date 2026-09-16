'use client'

import { useState } from 'react'

export const THEME_STORAGE_KEY = 'thriftlens_theme'

// Mirrors the inline pre-paint script in app/layout.tsx so the toggle and the
// first paint never disagree.
export function currentTheme(): 'light' | 'dark' {
  const attr = typeof document === 'undefined' ? null : document.documentElement.getAttribute('data-theme')
  return attr === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private mode / storage blocked — in-memory only.
  }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => currentTheme())
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => { applyTheme(next); setTheme(next) }}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 active:scale-95 hover:bg-slate-700/70 ${className}`}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? (
        // Sun — tap to go to the bright theme
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <circle cx="12" cy="12" r="6" fill="none" />
          <line x1="20.6" y1="12" x2="14" y2="12" />
          <line x1="20.6" y1="7.5" x2="15.4" y2="7.5" />
          <line x1="20.6" y1="16.5" x2="15.4" y2="16.5" />
        </svg>
      ) : (
        // Moon — tap to go back to the dark theme
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-slate-300">
          <path d="M4 12 A7 7 0 0 1 20 12 Z" />
        </svg>
      )}
    </button>
  )
}