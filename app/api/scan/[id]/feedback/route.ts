import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const body = await request.json()
  const { bought, buy_price_cents, identification_correct, actual_item_override } = body

  if (typeof bought !== 'boolean' && bought !== null) {
    return NextResponse.json({ error: 'bought must be boolean or null' }, { status: 400 })
  }

  await sql`
    UPDATE scans
    SET
      bought                  = ${bought ?? null},
      buy_price_cents         = ${buy_price_cents ?? null},
      identification_correct  = ${identification_correct ?? null},
      actual_item_override    = ${actual_item_override ?? null}
    WHERE id = ${id}::uuid
  `

  return NextResponse.json({ ok: true })
}
