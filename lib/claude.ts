import Anthropic from '@anthropic-ai/sdk'
import type { IdentificationResult, AnalysisResult, EbayComp } from '@/types'

const MODEL = 'claude-sonnet-4-6'
const TIMEOUT_MS = 45_000

// Lazy init — avoid throwing during Next.js build with placeholder env vars.
let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fn(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

type ClaudeMessageContent = { type: 'text'; text: string } | { type: string }

type ClaudeMessageResponse = {
  content: ClaudeMessageContent[]
}

function extractText(response: ClaudeMessageResponse): string {
  const textBlocks = response.content.filter((block) => block.type === 'text') as Array<{ type: 'text'; text: string }>
  return textBlocks.map((block) => block.text).join('\n')
}

const IDENTIFICATION_SYSTEM = `You are an expert thrift store reseller and appraiser with 15 years of experience. You specialize in identifying items quickly and accurately for resale value assessment. You respond ONLY with valid JSON. No markdown, no explanation, just the JSON object.`

const ANALYSIS_SYSTEM = `You are an expert reseller and market analyst specializing in thrift store flips. You know eBay fee structures, Poshmark, Mercari, and local selling markets. You respond ONLY with valid JSON. No markdown, no explanation, just the JSON object. When estimating prices without sold data, use your knowledge of recent secondary market values.`

export async function identifyItem(
  imageBase64: string,
  mediaType: string
): Promise<IdentificationResult> {
  return withTimeout(async (signal) => {
    const response = await getClient().messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        system: IDENTIFICATION_SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `Analyze this thrift store item photo and identify it for resale purposes.

Return a JSON object with exactly these fields:
{
  "item_name": "Full descriptive name (e.g., 'Vintage Levi's 501 Jeans')",
  "brand": "Brand name or null if unbranded/unknown",
  "model": "Model name/number or null",
  "category": "One of: clothing, electronics, collectibles, books, housewares, toys, sporting_goods, jewelry, furniture, art, other",
  "condition": "One of: like_new, good, fair, poor",
  "condition_notes": "Specific condition observations (stains, wear, missing parts, etc.)",
  "notable_features": ["array", "of", "key", "selling", "features"],
  "estimated_era": "Decade or year range if determinable (e.g., '1990s', '2000-2005'), or null",
  "ebay_search_query": "Best eBay search string for this item, optimized for finding comparable listings. Include brand, model, key descriptors. Max 8 words.",
  "confidence": "high | medium | low"
}

If you cannot identify the item at all, still return the JSON with your best guesses and set confidence to "low".`,
              },
            ],
          },
        ],
      },
      { signal }
    )

    const text = extractText(response)
    return parseJSON<IdentificationResult>(text)
  })
}

export async function analyzeItem(
  identification: IdentificationResult,
  comps: EbayComp[]
): Promise<AnalysisResult> {
  return withTimeout(async (signal) => {
    const trimmedComps = comps.slice(0, 6).map((comp) => ({
      title: comp.title,
      price: comp.price,
      condition: comp.condition,
      listing_url: comp.listing_url,
    }))
    const compsContext =
      trimmedComps.length > 0
        ? `Current eBay active listings for comparable items:\n${JSON.stringify(trimmedComps, null, 2)}`
        : `No eBay listings were found. Use your training knowledge of secondary market prices for this item.`

    const response = await getClient().messages.create(
      {
        model: MODEL,
        max_tokens: 2048,
        system: ANALYSIS_SYSTEM,
        messages: [
          {
            role: 'user',
            content: `You are analyzing a thrift store find for resale potential.

ITEM IDENTIFIED:
${JSON.stringify(identification, null, 2)}

MARKET DATA:
${compsContext}

Note: eBay listing prices above are in USD dollars (not cents).

Based on this information, provide a resale analysis. Return a JSON object with exactly these fields:
{
  "market_value_low": <integer, USD cents, conservative sold price estimate>,
  "market_value_high": <integer, USD cents, optimistic sold price estimate>,
  "suggested_list_price": <integer, USD cents, recommended eBay listing price>,
  "profit_estimate_low": <integer, USD cents, net profit after ~13% eBay fees + $5 shipping, at low price>,
  "profit_estimate_high": <integer, USD cents, net profit at high price>,
  "deal_score": "HOT | GOOD | PASS",
  "deal_score_reason": "One sentence explaining the score",
  "best_platforms": ["ordered", "list", "e.g.", "eBay", "Poshmark", "Facebook Marketplace"],
  "selling_tips": [
    "Specific tip 1",
    "Specific tip 2",
    "Specific tip 3"
  ],
  "keywords_for_listing": ["keyword1", "keyword2", "keyword3"],
  "watch_out_for": "Any authenticity concerns, common fakes, or issues that could affect sale",
  "data_confidence": "high | medium | low"
}

Deal score criteria:
- HOT: profit_estimate_high > 2000 (>$20) and item is easy to sell (common category, strong demand)
- GOOD: profit_estimate_high > 800 (>$8) and reasonable demand
- PASS: profit unlikely, item too common/damaged/niche, or market saturated

Account for eBay fees (~13.25% final value fee + payment processing) and shipping ($5-15 depending on size/weight).`,
          },
        ],
      },
      { signal }
    )

    const text = extractText(response)
    return parseJSON<AnalysisResult>(text)
  })
}

function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0]) as T
      } catch {
        // fall through
      }
    }
    throw new Error('AI returned an unparseable response. Please try again.')
  }
}
