import type { EbayComp } from '@/types'

const EBAY_OAUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token'
const EBAY_BROWSE_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search'
const EBAY_TIMEOUT_MS = 10_000

let tokenCache: { token: string; expiresAt: number } | null = null

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), EBAY_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null
  const asSeconds = Number.parseInt(headerValue, 10)
  if (Number.isFinite(asSeconds)) {
    return Math.max(0, asSeconds * 1000)
  }
  const asDate = Date.parse(headerValue)
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now())
  }
  return null
}

function backoffDelayMs(attempt: number): number {
  const base = Math.min(2000, 250 * 2 ** attempt)
  const jitter = Math.random() * 100
  return base + jitter
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt > now + 5 * 60 * 1000) {
    return tokenCache.token
  }

  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID and EBAY_CLIENT_SECRET must be set')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetchWithTimeout(EBAY_OAUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  })

  if (!response.ok) {
    throw new Error(`eBay OAuth failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }
  return tokenCache.token
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

async function fetchBrowse(query: string, limit: number, token: string) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort: 'newlyListed',
    filter: 'buyingOptions:{FIXED_PRICE}',
  })

  return fetchWithTimeout(`${EBAY_BROWSE_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      'Content-Type': 'application/json',
    },
  })
}

export async function fetchEbayComps(query: string, limit = 10): Promise<EbayComp[]> {
  try {
    let token = await getAccessToken()
    let response: Response | null = null
    let attempt = 0
    const maxAttempts = 3

    while (attempt < maxAttempts) {
      response = await fetchBrowse(query, limit, token)

      if (response.status === 401) {
        tokenCache = null
        token = await getAccessToken()
        attempt += 1
        continue
      }

      if (response.status === 429) {
        const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'))
        await sleep(retryAfterMs ?? backoffDelayMs(attempt))
        attempt += 1
        continue
      }

      if (response.status >= 500) {
        await sleep(backoffDelayMs(attempt))
        attempt += 1
        continue
      }

      break
    }

    if (!response || !response.ok) {
      const status = response?.status ?? 'no_response'
      console.error(`eBay Browse API error: ${status}`)
      return []
    }

    const data = await response.json()
    const items: EbayComp[] = mapEbayItems(data.itemSummaries ?? [])

    return items
  } catch (err) {
    console.error('eBay fetch error:', err)
    return []
  }
}
