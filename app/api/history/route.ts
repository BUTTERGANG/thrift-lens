import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 20), 50)
  const offset = Math.min(1000, Math.max(0, Number(request.nextUrl.searchParams.get('offset') ?? 0)))

  const rows = await sql`
    SELECT id, item_identified, brand, deal_score, market_value_low, market_value_high, store_name, created_at
    FROM scans
    WHERE user_id = ${session.userId}::uuid
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return Response.json({ scans: rows })
}
