import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { identifyItem, analyzeItem } from '@/lib/claude'
import { fetchEbayComps } from '@/lib/ebay'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import sql from '@/lib/db'
import type { EbayComp } from '@/types'

// HEIC/HEIF are excluded: Anthropic Vision only accepts jpeg/png/gif/webp.
// iPhone users should enable Settings > Camera > Formats > Most Compatible.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

const HEIC_TYPES = new Set(['image/heic', 'image/heif'])
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 scans per IP per minute
    const ip = getClientIp(request.headers)

    const { allowed, retryAfterMs } = await checkRateLimit(`scan:${ip}`, 5, 60_000)
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
    const sessionId = formData.get('session_id') as string | null
    const storeName = (formData.get('store_name') as string | null) || null
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null

    if (!imageFile) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }
    if (!sessionId) {
      return Response.json({ error: 'No session_id provided' }, { status: 400 })
    }
    if (!UUID_REGEX.test(sessionId)) {
      return Response.json({ error: 'Invalid session_id' }, { status: 400 })
    }

    // Server-side MIME type validation
    const mediaType = imageFile.type || 'image/jpeg'
    if (HEIC_TYPES.has(mediaType)) {
      return Response.json(
        { error: 'HEIC photos aren\'t supported. On your iPhone, go to Settings → Camera → Formats and choose "Most Compatible", then retake the photo.' },
        { status: 415 }
      )
    }
    if (!ALLOWED_MIME_TYPES.has(mediaType)) {
      return Response.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 415 }
      )
    }

    if (imageFile.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: 'Image too large. Max 10MB.' }, { status: 413 })
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const imageBase64 = buffer.toString('base64')

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
          session_id, item_identified, brand, condition, deal_score,
          market_value_low, market_value_high, profit_estimate,
          profit_estimate_low, profit_estimate_high,
          identification_json, analysis_json, ebay_comps_json,
          store_name, latitude, longitude
        ) VALUES (
          ${sessionId}::uuid,
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
    console.error('Scan error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Scan failed' },
      { status: 500 }
    )
  }
}
