/**
 * eBay Proxy client — drop-in alternative to lib/ebay.ts.
 *
 * Routes all eBay searches through the shared eBay API Proxy.
 * Same return type as fetchEbayComps() in lib/ebay.ts.
 *
 * Usage:
 *   import { fetchEbayComps } from '@/lib/ebay-proxy'
 *   const comps = await fetchEbayComps("Levi's 501 size 32x34")
 *
 * To switch, change one import line in app/api/scan/route.ts and
 * app/api/ebay/route.ts. No env vars to change — uses EBAY_PROXY_URL
 * and EBAY_PROXY_TOKEN (set these in Replit secrets instead of
 * EBAY_CLIENT_ID / EBAY_CLIENT_SECRET).
 */

import type { EbayComp } from '@/types'

const PROXY_TIMEOUT_MS = 15_000

function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  )
}

function mapEbayItems(items: Array<Record<string, unknown>>): EbayComp[] {
  return items
    .map((item): EbayComp | null => {
      const rawPrice = (item.price as { value: string } | undefined)?.value ?? '0'
      const price = Number.parseFloat(rawPrice)
      if (!Number.isFinite(price) || price <= 0) return null
      return {
        title: (item.title as string) ?? 'Unknown item',
        price,
        currency: (item.price as { currency: string } | undefined)?.currency ?? 'USD',
        condition: (item.condition as string) ?? 'Unknown',
        listing_url: (item.itemWebUrl as string) ?? '',
        image_url: (item.image as { imageUrl: string } | undefined)?.imageUrl ?? null,
        end_date: (item.itemEndDate as string) ?? null,
        marketplace: 'ebay' as const,
      }
    })
    .filter((item): item is EbayComp => item !== null)
}

/**
 * Fetch eBay comps through the shared proxy.
 *
 * Requires EBAY_PROXY_URL and EBAY_PROXY_TOKEN env vars instead of
 * EBAY_CLIENT_ID / EBAY_CLIENT_SECRET.
 *
 * Returns the same shape as lib/ebay.ts's fetchEbayComps() —
 * an array of EbayComp items or [] on failure.
 */
export async function fetchEbayComps(
  query: string,
  limit = 10,
): Promise<EbayComp[]> {
  const proxyUrl = process.env.EBAY_PROXY_URL
  const proxyToken = process.env.EBAY_PROXY_TOKEN

  if (!proxyUrl || !proxyToken) {
    console.error(
      'EBAY_PROXY_URL and EBAY_PROXY_TOKEN must be set — falling back to direct eBay client',
    )
    // Fall through to dynamic import of the original ebay.ts
    const { fetchEbayComps: fallback } = await import('@/lib/ebay')
    return fallback(query, limit)
  }

  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    })

    const base = proxyUrl.replace(/\/$/, '')
    const response = await fetchWithTimeout(`${base}/comps?${params}`, {
      headers: {
        Authorization: `Bearer ${proxyToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Proxy auth failed — check EBAY_PROXY_TOKEN')
      } else if (response.status === 429) {
        console.warn('Proxy rate-limited')
      } else {
        console.error(`Proxy HTTP ${response.status}: ${await response.text()}`)
      }
      return []
    }

    const data = await response.json()
    const items: EbayComp[] = mapEbayItems(data.items ?? [])
    return items
  } catch (err) {
    console.error('Proxy fetch error:', err)
    return []
  }
}