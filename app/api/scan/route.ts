import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { identifyItem, analyzeItem } from '@/lib/claude'
import { fetchEbayComps } from '@/lib/ebay'
import { checkRateLimit } from '@/lib/rateLimit'
import { requireSession } from '@/lib/auth'
import { looksLikeHeic, heicToJpeg } from '@/lib/heic'
import sql from '@/lib/db'
import type { EbayComp } from '@/types'

// Anthropic Vision accepts only jpeg/png/gif/webp. HEIC/HEIF is converted to
// JPEG server-side (lib/heic.ts) — the browser converts first when it can.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

const HEIC_TYPES = new Set(['image/heic', 'image/heif'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()

    // Rate limit: 5 scans per user per minute. Keyed on user id, not IP —
    // Replit's proxy collapses client IPs, and scans require a session anyway.
    const { allowed, retryAfterMs } = await checkRateLimit(`scan:${session.userId}`, 5, 60_000)
    if (!allowed) {
      return Response.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const storeName = (formData.get('store_name') as string | null) || null
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null

    if (!imageFile) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    if (imageFile.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: 'Image too large. Max 10MB.' }, { status: 413 })
    }

    let mediaType = imageFile.type || 'image/jpeg'
    let bytes = new Uint8Array(await imageFile.arrayBuffer())

    // HEIC → JPEG. Trust the header sniff over the MIME type: desktop browsers
    // often send a .heic with no/octet-stream type.
    if (HEIC_TYPES.has(mediaType) || looksLikeHeic(bytes)) {
      try {
        bytes = await heicToJpeg(bytes)
        mediaType = 'image/jpeg'
      } catch (err) {
        console.error('HEIC conversion failed:', err instanceof Error ? err.stack : err)
        return Response.json(
          {
            error:
              "We couldn't convert that HEIC photo. On your iPhone, Settings → Camera → Formats → \"Most Compatible\" makes new photos upload as JPEG.",
          },
          { status: 415 }
        )
      }
    }

    if (!ALLOWED_MIME_TYPES.has(mediaType)) {
      return Response.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 415 }
      )
    }

    // Anthropic Vision only accepts image/jpeg (not the "image/jpg" some browsers
    // and Windows systems emit). Normalize before the API call below.
    if (mediaType === 'image/jpg') {
      mediaType = 'image/jpeg'
    }

    const imageBase64 = Buffer.from(bytes).toString('base64')

    // Step 1: Identify item with Claude Vision
    const identification = await identifyItem(imageBase64, mediaType)

    // Step 2: Check comps cache
    const rawQuery = identification.ebay_search_query ?? ''
    const normalizedQuery = rawQuery.replace(/\s+/g, ' ').trim()
    const fallbackQuery = [identification.brand, identification.model, identification.item_name]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    const searchQuery = normalizedQuery.length >= 3 ? normalizedQuery : fallbackQuery
    let comps: EbayComp[] = []

    if (searchQuery) {
      const queryHash = createHash('sha256').update(searchQuery.toLowerCase().trim()).digest('hex')

      const cached = await sql`
        SELECT comps_json FROM comps_cache
        WHERE query_hash = ${queryHash} AND expires_at > NOW()
        LIMIT 1
      `

      if (cached.length > 0) {
        comps = cached[0].comps_json as EbayComp[]
      } else {
        // Step 3: Fetch eBay comps
        comps = await fetchEbayComps(searchQuery)

        // Cache the result
        try {
          await sql`
            INSERT INTO comps_cache (query_hash, comps_json)
            VALUES (${queryHash}, ${JSON.stringify(comps)}::jsonb)
            ON CONFLICT (query_hash) DO UPDATE SET
              comps_json = EXCLUDED.comps_json,
              fetched_at = NOW(),
              expires_at = NOW() + INTERVAL '24 hours'
          `
        } catch (cacheErr) {
          console.error('Cache write error:', cacheErr)
        }
      }
    }

    // Step 4: Analyze with Claude (text-only, no image = cheaper)
    const analysis = await analyzeItem(identification, comps)

    // Step 5: Persist scan
    let scanId: string | null = null
    try {
      const inserted = await sql`
        INSERT INTO scans (
          user_id, item_identified, brand, condition, deal_score,
          market_value_low, market_value_high, profit_estimate,
          profit_estimate_low, profit_estimate_high,
          identification_json, analysis_json, ebay_comps_json,
          store_name, latitude, longitude
        ) VALUES (
          ${session.userId}::uuid,
          ${identification.item_name},
          ${identification.brand},
          ${identification.condition},
          ${analysis.deal_score},
          ${analysis.market_value_low},
          ${analysis.market_value_high},
          ${Math.round((analysis.profit_estimate_low + analysis.profit_estimate_high) / 2)},
          ${analysis.profit_estimate_low},
          ${analysis.profit_estimate_high},
          ${JSON.stringify(identification)}::jsonb,
          ${JSON.stringify(analysis)}::jsonb,
          ${JSON.stringify(comps)}::jsonb,
          ${storeName},
          ${latitude},
          ${longitude}
        )
        RETURNING id
      `
      scanId = inserted[0].id
    } catch (dbErr) {
      // DB unavailable — return analysis inline so client can show preview
      console.error('DB insert error:', dbErr)
    }

    return Response.json({
      scan_id: scanId,          // null when DB unavailable
      item_identified: identification.item_name,
      brand: identification.brand,
      deal_score: analysis.deal_score,
      analysis,
      identification,
      comps,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed'
    if (message === 'Not authenticated') {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.error('Scan error:', err)
    // Only forward messages that were written for end users (lib/claude.ts).
    // Anything else may leak internal details, so return a generic message.
    const safe = /^(The item analysis|The analysis took too long|AI returned)/.test(message)
    return Response.json(
      { error: safe ? message : 'Something went wrong while analyzing this item. Please try again.' },
      { status: 500 }
    )
  }
}
