const CHECKIN_KEY = 'thriftlens_checkin'

export interface CheckIn {
  store_name: string
  latitude: number
  longitude: number
  checked_in_at: string
}

export function getCheckIn(): CheckIn | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CHECKIN_KEY)
    return raw ? (JSON.parse(raw) as CheckIn) : null
  } catch {
    return null
  }
}

export function setCheckIn(data: Omit<CheckIn, 'checked_in_at'>): CheckIn {
  const checkin: CheckIn = { ...data, checked_in_at: new Date().toISOString() }
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkin))
  return checkin
}

export function clearCheckIn() {
  localStorage.removeItem(CHECKIN_KEY)
}

export async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10_000,
      maximumAge: 60_000,
    })
  })
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'ThriftLens/1.0' },
  })
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()

  const addr = data.address ?? {}
  // Prefer a named shop/amenity → fall back to road + city
  const shopName =
    addr.amenity ??
    addr.shop ??
    addr.building ??
    addr.retail ??
    null

  const road = addr.road ?? addr.pedestrian ?? ''
  const city = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? ''

  if (shopName) {
    return city ? `${shopName} — ${city}` : shopName
  }
  if (road && city) return `${road}, ${city}`
  if (city) return city
  return data.display_name?.split(',').slice(0, 2).join(',').trim() ?? 'Unknown location'
}
