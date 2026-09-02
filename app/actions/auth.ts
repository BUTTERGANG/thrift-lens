'use server'

import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { createSession, deleteSession } from '@/lib/auth'

export type AuthState = {
  error?: string
} | undefined

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const MIN_PASSWORD_LENGTH = 8

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = (formData.get('username') as string ?? '').trim()
  const password = formData.get('password') as string ?? ''
  const confirm = formData.get('confirm') as string ?? ''

  if (!USERNAME_RE.test(username)) {
    return { error: 'Username must be 3–30 characters: letters, numbers, underscores only.' }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.' }
  }

  // Check for existing user (case-insensitive)
  const existing = await sql`
    SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1
  `
  if (existing.length > 0) {
    return { error: 'Username already taken.' }
  }

  const passwordHash = await hashPassword(password)

  const rows = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id
  `

  const user = rows[0]
  if (!user) {
    return { error: 'Could not create account. Please try again.' }
  }

  await createSession(user.id, username)
  redirect('/')
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = (formData.get('username') as string ?? '').trim()
  const password = formData.get('password') as string ?? ''

  if (!username || !password) {
    return { error: 'Username and password are required.' }
  }

  const rows = await sql`
    SELECT id, username, password_hash FROM users
    WHERE LOWER(username) = LOWER(${username})
    LIMIT 1
  `

  if (rows.length === 0) {
    return { error: 'Invalid username or password.' }
  }

  const user = rows[0]
  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return { error: 'Invalid username or password.' }
  }

  await createSession(user.id, user.username)
  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
