import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const encodedKey = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'dev-secret-change-me'
)

// Routes that don't require auth
const PUBLIC_PATHS = [
  '/login',
  '/api/ebay/account-deletion',
  '/api/migrate',
  '/sw.js',
  '/icon',
  '/apple-icon',
  '/manifest.webmanifest',
]
const PUBLIC_PREFIXES = ['/api/pwa-icon', '/_next', '/icons/']
const PUBLIC_EXTENSIONS = ['.ico', '.png', '.svg', '.webmanifest']

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  if (PUBLIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return true
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // API routes expect JSON, not an HTML login redirect. A 307 to /login makes
  // client fetch() calls follow through to an HTML page and then blow up in
  // res.json(); return a proper 401 the callers already handle instead.
  const isApi = pathname.startsWith('/api/')

  const unauthorized = () => {
    if (isApi) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }

  const token = request.cookies.get('session')?.value

  if (!token) {
    return unauthorized()
  }

  try {
    await jwtVerify(token, encodedKey, { algorithms: ['HS256'] })
    return NextResponse.next()
  } catch {
    // Invalid or expired token — clear cookie and redirect (or 401 for APIs)
    return unauthorized()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
