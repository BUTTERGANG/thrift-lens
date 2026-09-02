# AI Pipeline

## Overview

ThriftLens uses a **two-call AI strategy** with Claude Sonnet 4.6 via the Anthropic SDK. The pipeline splits item identification (requires image) from market analysis (text-only), optimizing for cost and quality.

**File:** `lib/claude.ts`

```
Photo → [Call 1: Vision] → Identification → eBay Search → [Call 2: Text] → Analysis
```

---

## Call 1: Vision Identification

**Purpose:** Identify the item in the photo.

**Input:** Base64-encoded image (JPEG, PNG, WEBP, or GIF)

**Model:** Claude Sonnet 4.6

**Prompt structure:**
- System prompt: "You are a thrift store item identification expert..."
- User message: Image (base64) + instruction to identify and return structured JSON

### Output: IdentificationResult

```typescript
{
  item_name: "Nike Air Max 90",           // What the item is
  brand: "Nike",                           // Brand (null if unidentifiable)
  model: "Air Max 90",                     // Specific model (null if unknown)
  category: "Shoes",                       // Item category
  condition: "good",                       // like_new | good | fair | poor
  condition_notes: "Minor sole wear",      // Specific condition observations
  notable_features: ["OG colorway"],       // Valuable/notable attributes
  estimated_era: "2019-2020",              // Manufacturing era estimate
  ebay_search_query: "Nike Air Max 90 OG", // Optimized eBay search terms
  confidence: "high"                       // high | medium | low
}
```

### Key Design Choices

- **Structured JSON output**: Claude is instructed to return pure JSON (no markdown, no explanation)
- **eBay search query generation**: Claude crafts an optimized search query based on what it sees, which is used to fetch real comps
- **Confidence level**: Helps the UI indicate when results may be less reliable
- **No price estimation in this call**: Pricing comes from the analysis call which has access to real market data

---

## eBay Comp Fetch (Between Calls)

After identification, the `ebay_search_query` is used to fetch live eBay comparable listings:

1. Normalize query (lowercase, trim)
2. SHA-256 hash the normalized query
3. Check `comps_cache` table for unexpired entry
4. If cache hit → use cached comps
5. If cache miss → call eBay Browse API → cache results for 24 hours

See [EBAY-INTEGRATION.md](./EBAY-INTEGRATION.md) for full details.

---

## Call 2: Text Analysis

**Purpose:** Analyze market value and provide selling recommendations using real comp data.

**Input:** Text only (no image) — the identification result + eBay comp data

**Model:** Claude Sonnet 4.6

**Prompt structure:**
- System prompt: "You are a resale market analyst..."
- User message: Identification JSON + eBay comps JSON + instruction to analyze

### Output: AnalysisResult

```typescript
{
  market_value_low: 4500,                // Low estimate in cents
  market_value_high: 8500,               // High estimate in cents
  suggested_list_price: 6500,            // Recommended listing price (cents)
  profit_estimate_low: 3500,             // Low profit estimate (cents)
  profit_estimate_high: 7500,            // High profit estimate (cents)
  deal_score: "HOT",                     // HOT | GOOD | PASS
  deal_score_reason: "Strong demand...", // Why this score
  best_platforms: ["eBay", "StockX"],    // Where to sell
  selling_tips: ["Clean soles..."],      // Actionable advice
  keywords_for_listing: ["Nike", "OG"],  // SEO keywords
  watch_out_for: "Check for...",         // Warnings
  data_confidence: "high"                // high | medium | low
}
```

### Key Design Choices

- **Text-only call**: No image tokens = cheaper and faster
- **Real comp data**: Claude sees actual eBay prices, not just its training data
- **Deal scoring**: Based on comp analysis, not just item recognition
- **Cents for prices**: Avoids floating-point issues in database storage
- **Profit estimate**: Assumes a typical thrift store purchase price

---

## Why Two Calls?

| Aspect | Single Call | Two Calls (current) |
|--------|-------------|---------------------|
| Image cost | Paid once | Paid once (call 1 only) |
| Analysis quality | No real comp data | Has real eBay prices |
| Cacheability | None | Comps cached 24h |
| Flexibility | Tightly coupled | Can upgrade calls independently |
| Total latency | ~8-12s | ~15-25s (but better results) |

The two-call approach trades ~10 extra seconds of latency for significantly better market analysis, since the second call can reference actual current eBay prices rather than relying on Claude's potentially outdated training data.

---

## Error Handling

- If Call 1 fails → 500 error, scan aborted
- If eBay fetch fails → analysis continues with empty comps array
- If Call 2 fails → 500 error, scan aborted
- If JSON parsing fails for either call → 500 error

---

## Configuration

| Env Variable | Purpose |
|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API authentication |

**Model used:** Claude Sonnet 4.6 (configured in `lib/claude.ts`)
