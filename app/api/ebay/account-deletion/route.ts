import { NextRequest } from 'next/server'
import crypto from 'crypto'

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN ?? ''

/**
 * eBay Marketplace Account Deletion/Closure notification endpoint.
 *
 * GET  — eBay challenge validation (returns challengeResponse hash)
 * POST — Account deletion notification (no-op; we don't store eBay user data)
 *
 * See: https://developer.ebay.com/marketplace-account-deletion
 */

/**
 * The endpoint URL eBay hashes against must exactly match the one registered in
 * the eBay developer portal. Behind a proxy (Replit, Vercel, etc.) `nextUrl.origin`
 * is the internal origin (e.g. http://localhost:5000), which would never match.
 * Prefer an explicit env var, then the forwarded headers, then the raw origin.
 */
function resolveEndpointUrl(request: NextRequest): string {
  const configured = process.env.EBAY_DELETION_ENDPOINT ?? process.env.APP_URL
  if (configured) {
    return new URL('/api/ebay/account-deletion', configured).toString()
  }
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const base = host ? `${proto}://${host}` : request.nextUrl.origin
  return new URL('/api/ebay/account-deletion', base).toString()
}

export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get('challenge_code')

  if (!challengeCode) {
    return Response.json({ error: 'Missing challenge_code' }, { status: 400 })
  }

  const endpoint = resolveEndpointUrl(request)

  const hash = crypto
    .createHash('sha256')
    .update(challengeCode)
    .update(VERIFICATION_TOKEN)
    .update(endpoint)
    .digest('hex')

  return Response.json(
    { challengeResponse: hash },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export async function POST() {
  // We only use client-credentials (Browse API) and store no eBay user data,
  // so there is nothing to delete. Acknowledge receipt.
  return Response.json({ status: 'acknowledged' }, { status: 200 })
}
