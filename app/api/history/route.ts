import { NextRequest } from 'next/server'
import sql from '@/lib/db'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return Response.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 20), 50)
  const offset = Math.min(1000, Math.max(0, Number(request.nextUrl.searchParams.get('offset') ?? 0)))

  const rows = await sql`
    SELECT id, item_identified, brand, deal_score, market_value_low, market_value_high, created_at
    FROM scans
    WHERE session_id = ${sessionId}::uuid
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return Response.json({ scans: rows })
}
