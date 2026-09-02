'use client'

import { logout } from '@/app/actions/auth'
import { IconUser, IconLogout } from '@/components/icons'

export function UserMenu({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-slate-400 text-xs">
        <IconUser size={13} strokeWidth={2} />
        <span className="max-w-[100px] truncate">{username}</span>
      </span>
      <form action={logout}>
        <button
          type="submit"
          className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors"
          title="Sign out"
        >
          <IconLogout size={14} strokeWidth={2} />
        </button>
      </form>
    </div>
  )
}
