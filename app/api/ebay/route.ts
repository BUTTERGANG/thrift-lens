import { NextRequest } from 'next/server'
import { fetchEbayComps } from '@/lib/ebay'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  // Dev-only endpoint — block in production unless a debug token is provided
  const debugToken = request.nextUrl.searchParams.get('token')
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.DEBUG_TOKEN || debugToken !== process.env.DEBUG_TOKEN)
  ) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const ip = getClientIp(request.headers)
  const { allowed } = await checkRateLimit(`ebay:${ip}`, 10, 60_000)
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  const q = request.nextUrl.searchParams.get('q')
  if (!q) {
    return Response.json({ error: 'Query parameter q is required' }, { status: 400 })
  }

  const comps = await fetchEbayComps(q)
  return Response.json({ comps, total: comps.length, source: 'ebay_browse' })
}
