export interface IdentificationResult {
  item_name: string
  brand: string | null
  model: string | null
  category: string
  condition: 'like_new' | 'good' | 'fair' | 'poor'
  condition_notes: string
  notable_features: string[]
  estimated_era: string | null
  ebay_search_query: string
  confidence: 'high' | 'medium' | 'low'
}

export interface AnalysisResult {
  market_value_low: number
  market_value_high: number
  suggested_list_price: number
  profit_estimate_low: number
  profit_estimate_high: number
  deal_score: 'HOT' | 'GOOD' | 'PASS'
  deal_score_reason: string
  best_platforms: string[]
  selling_tips: string[]
  keywords_for_listing: string[]
  watch_out_for: string
  data_confidence: 'high' | 'medium' | 'low'
}

export interface EbayComp {
  title: string
  price: number        // USD dollars (e.g. 24.99)
  currency: string
  condition: string
  listing_url: string
  image_url: string | null
  end_date: string | null
  marketplace: 'ebay'
}

export interface ScanRecord {
  id: string
  item_identified: string
  brand: string | null
  condition: string | null
  deal_score: 'HOT' | 'GOOD' | 'PASS'
  market_value_low: number
  market_value_high: number
  profit_estimate: number | null
  profit_estimate_low: number | null
  profit_estimate_high: number | null
  identification_json: IdentificationResult | null
  analysis_json: AnalysisResult
  ebay_comps_json: EbayComp[] | null
  created_at: string
  // feedback fields
  bought: boolean | null
  buy_price_cents: number | null
  identification_correct: boolean | null
  actual_item_override: string | null
  // location fields
  store_name: string | null
  latitude: number | null
  longitude: number | null
}

export interface ScanResponse {
  scan_id: string | null   // null when DB insert failed
  item_identified: string
  brand: string | null
  deal_score: 'HOT' | 'GOOD' | 'PASS'
  analysis: AnalysisResult
  identification: IdentificationResult
  comps: EbayComp[]
}
