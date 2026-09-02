'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { login, signup, type AuthState } from '@/app/actions/auth'
import { IconSearch } from '@/components/icons'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, undefined)
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signup, undefined)
  const [mounted, setMounted] = useState(false)

  // Render the form only after hydration so password-manager DOM injection
  // can't cause a server/client mismatch. This is the canonical "have we
  // mounted" flag — the one setState-in-effect the rule can't model.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const state = mode === 'login' ? loginState : signupState
  const pending = mode === 'login' ? loginPending : signupPending

  return (
    <main className="min-h-screen text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <IconSearch size={24} strokeWidth={2.5} className="text-amber-400" />
            <h1 className="text-2xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Thrift
              </span>
              <span className="text-white">Lens</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-slate-800/80 rounded-xl p-1 mb-6 border border-slate-700/40">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              mode === 'login'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              mode === 'signup'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form — only rendered client-side to prevent hydration mismatch from password manager extensions */}
        {mounted && (
          <form
            action={mode === 'login' ? loginAction : signupAction}
            className="space-y-4"
          >
            <div>
              <label htmlFor="username" className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                placeholder="your_username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                placeholder="••••••••"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirm" className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            {state?.error && (
              <div className="bg-red-950/50 border border-red-800 rounded-xl p-3 text-red-400 text-sm">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/25 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>
        )}

        <p className="text-slate-600 text-xs text-center mt-6">
          {mode === 'login'
            ? "Don't have an account? Switch to Sign Up above."
            : 'Already have an account? Switch to Sign In above.'
          }
        </p>
      </div>
    </main>
  )
}
