'use client'

/**
 * Anthropic's vision API only accepts JPEG/PNG/GIF/WebP — never HEIC/HEIF.
 * iOS Safari decodes HEIC natively, so we can rasterise it through a <canvas>
 * and re-encode as JPEG in the browser (no libheif dependency). The same pass
 * downscales large photos, which every phone camera produces, so uploads stay
 * small and Claude isn't billed for pixels it doesn't need.
 */

const MAX_DIMENSION = 2048
const JPEG_QUALITY = 0.9

export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The browser could not decode this image.'))
    img.src = url
  })
}

/**
 * Convert HEIC → JPEG and/or downscale an oversized photo.
 * Returns the original file unchanged if it's already a web-safe format at a
 * reasonable size. Throws if the image can't be decoded (e.g. a HEIC on a
 * non-Safari browser) so the caller can show a helpful message.
 */
export async function toUploadableImage(file: File): Promise<File> {
  const heic = isHeic(file)
  const webSafe = /image\/(jpeg|png|webp)/i.test(file.type)

  // Small, already-web-safe images need no work.
  if (!heic && webSafe && file.size <= 2 * 1024 * 1024) return file

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) throw new Error('The image has no readable dimensions.')

    const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h))
    const needsResize = scale < 1
    if (!heic && webSafe && !needsResize) return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    if (!blob) throw new Error('The browser could not re-encode this image.')

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    URL.revokeObjectURL(url)
  }
}
