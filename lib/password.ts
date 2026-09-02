import { scrypt, randomBytes, timingSafeEqual } from 'crypto'

const SALT_LENGTH = 16
const KEY_LENGTH = 64
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':')
  if (!salt || !key) return false

  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })

  const keyBuffer = Buffer.from(key, 'hex')
  // timingSafeEqual throws if lengths differ (e.g. a truncated/corrupt stored
  // hash). Treat any shape mismatch as a failed verification.
  if (keyBuffer.length !== derived.length) return false
  return timingSafeEqual(derived, keyBuffer)
}
