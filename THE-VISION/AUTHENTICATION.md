# Authentication

## Overview

ThriftLens uses a stateless JWT authentication system with scrypt password hashing. No email is required — users sign up with a username and password.

```
User → Login Form → Server Action → Verify Password → Create JWT → Set Cookie
                                                                        │
Browser → Every Request → Middleware → Verify JWT → Allow / Redirect to /login
```

## Components

| File | Responsibility |
|------|---------------|
| `lib/auth.ts` | JWT encrypt/decrypt, session create/get/delete |
| `lib/password.ts` | scrypt hashing + timing-safe verification |
| `app/actions/auth.ts` | Server actions: signup, login, logout |
| `app/login/page.tsx` | Login/signup UI |
| `proxy.ts` | Middleware route protection |

---

## Password Hashing

**File:** `lib/password.ts`

**Algorithm:** scrypt (Node.js `crypto.scrypt`)

**Parameters:**
- N = 16384 (CPU/memory cost)
- r = 8 (block size)
- p = 1 (parallelization)
- Salt: 16 random bytes
- Key length: 64 bytes

**Storage format:** `salt_hex:key_hex`

**Verification:** Uses `crypto.timingSafeEqual` to prevent timing attacks.

```
hashPassword("mypassword")
→ "a1b2c3d4...:e5f6a7b8..."  (salt:derived_key, both hex)

verifyPassword("mypassword", stored_hash)
→ true/false (timing-safe comparison)
```

---

## JWT Sessions

**File:** `lib/auth.ts`

**Library:** `jose` (JavaScript Object Signing and Encryption)

**Algorithm:** HS256 (HMAC-SHA256)

**Secret:** `AUTH_SECRET` environment variable (encoded to Uint8Array)

**Token lifetime:** 7 days

### Session Payload

```typescript
interface SessionPayload {
  userId: string    // UUID
  username: string  // Display name
  exp: number       // Expiration timestamp
}
```

### Cookie Configuration

| Property | Value | Purpose |
|----------|-------|---------|
| `name` | `session` | Cookie key |
| `httpOnly` | `true` | No JS access (XSS protection) |
| `secure` | `true` in production | HTTPS only in prod |
| `sameSite` | `lax` | CSRF protection |
| `path` | `/` | Available site-wide |
| `expires` | 7 days from creation | Auto-expiry |

### Key Functions

- **`encrypt(payload)`** — Creates a signed JWT with 7-day expiration
- **`decrypt(token)`** — Verifies signature and returns payload (or null)
- **`createSession(userId, username)`** — Encrypts JWT + sets cookie
- **`deleteSession()`** — Clears the session cookie
- **`getSession()`** — Reads cookie, decrypts, returns payload. Cached per-request via React `cache()`.
- **`requireSession()`** — Like getSession but throws if no session exists

---

## Server Actions

**File:** `app/actions/auth.ts`

### signup(formData)

1. Extract username, password, confirm from FormData
2. Validate username: 3-30 chars, `/^[a-zA-Z0-9_]+$/`
3. Validate password: minimum 8 characters
4. Confirm passwords match
5. Check for existing user (case-insensitive `LOWER(username)`)
6. Hash password with scrypt
7. Insert user into `users` table
8. Create JWT session
9. Redirect to `/`

**Errors returned:** Invalid username format, password too short, passwords don't match, username taken.

### login(formData)

1. Extract username, password from FormData
2. Look up user by `LOWER(username)`
3. If not found → "Invalid username or password"
4. Verify password hash
5. If wrong → "Invalid username or password" (same message, no username enumeration)
6. Create JWT session
7. Redirect to `/`

### logout()

1. Delete session cookie
2. Redirect to `/login`

---

## Middleware (Route Protection)

**File:** `proxy.ts`

Runs before every request. Checks JWT validity for protected routes.

### Flow

```
Request → Is public route? ─── Yes → Allow
                │
                No
                │
         Has session cookie? ─── No → Redirect /login
                │
                Yes
                │
         JWT valid? ─── No → Clear cookie + redirect /login
                │
                Yes
                │
         Allow request
```

### Public Routes

Routes that skip JWT verification:
- `/login`
- `/api/ebay/account-deletion`
- `/api/migrate`
- `/sw.js`
- `/_next/*`
- `/manifest.json`
- `/icons/*`
- Static assets (`*.ico`, `*.png`, `*.svg`, `*.webmanifest`)

---

## Security Properties

| Property | Implementation |
|----------|---------------|
| Password storage | scrypt with random salt (never plaintext) |
| Timing attacks | `timingSafeEqual` for password verification |
| Username enumeration | Same error for wrong username and wrong password |
| XSS token theft | HttpOnly cookie (JS cannot access) |
| CSRF | SameSite=lax cookie policy |
| HTTPS enforcement | Secure flag in production |
| Session expiry | 7-day JWT expiration, enforced by middleware |
| Case collision | Case-insensitive unique index on username |
