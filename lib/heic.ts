import 'server-only'

// ISO base-media-file-format major brands that mean "this is a HEIC still".
// iPhone photos are usually `heic`; bursts/live use `msf1`/`hevc`.
const HEIC_BRANDS = new Set([
  'heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1',
])

function ascii(buf: Uint8Array, start: number, end: number): string {
  let s = ''
  for (let i = start; i < end && i < buf.length; i++) s += String.fromCharCode(buf[i])
  return s
}

/**
 * Sniff the file header. Desktop browsers frequently upload a `.heic` with an
 * empty or `application/octet-stream` MIME type, so we can't trust `file.type`.
 */
export function looksLikeHeic(buf: Uint8Array): boolean {
  if (buf.length < 12) return false
  if (ascii(buf, 4, 8) !== 'ftyp') return false
  return HEIC_BRANDS.has(ascii(buf, 8, 12).toLowerCase())
}

/**
 * Convert a HEIC/HEIF buffer to JPEG. Uses `heic-convert` (pure JS + a WASM
 * libheif), so it works anywhere Node runs — no native build, no system codec.
 * Slower than a browser's hardware decoder (~1–3s for a 12MP photo), which is
 * why the client converts first when it can and this is only the fallback.
 *
 * The decoded image is then downscaled to <=2048px with sharp (sharp can't
 * *decode* HEIC here, but JPEG resize/encode is fine) so Claude isn't billed
 * for a full 12MP frame.
 */
export async function heicToJpeg(buf: Uint8Array) {
  const convert = (await import('heic-convert')).default
  const full = await convert({ buffer: buf, format: 'JPEG', quality: 0.92 })

  try {
    const sharp = (await import('sharp')).default
    const resized = await sharp(Buffer.from(full))
      .rotate() // honour EXIF orientation before stripping metadata
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    return new Uint8Array(resized)
  } catch (err) {
    // If sharp is unavailable for any reason, the full-size JPEG still works.
    console.error('HEIC downscale skipped:', err instanceof Error ? err.message : err)
    return new Uint8Array(full)
  }
}
