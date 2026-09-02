import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'

const SECRET = process.env.SESSION_SECRET
if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production')
}
const encodedKey = new TextEncoder().encode(SECRET ?? 'dev-secret-change-me')

const SESSION_COOKIE = 'session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface SessionPayload {
  userId: string
  username: string
  exp?: number
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, username: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encrypt({ userId, username })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/** Cached per-request — call freely in server components / actions. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return decrypt(token)
})

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')
  return session
}
