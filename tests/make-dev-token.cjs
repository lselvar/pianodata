/**
 * Generates a local-dev JWT for raj.selvaraj.arch@gmail.com and saves
 * auth state to tests/.auth/state.json so Playwright tests can run
 * without going through Google OAuth.
 *
 * Uses the default dev secret from application.properties:
 *   changeme-this-must-be-at-least-256-bits-long-secret-key
 *
 * The token is verified against the running backend before saving.
 * Only works against a LOCAL backend (not production).
 *
 * Usage: node tests/make-dev-token.cjs
 */

const crypto = require('crypto')
const http = require('http')
const { mkdirSync, writeFileSync } = require('fs')
const path = require('path')

const STATE_FILE = path.resolve(__dirname, '.auth', 'state.json')
const BACKEND = 'http://localhost:8080'
const FRONTEND_ORIGIN = 'http://localhost:5173'

// ── Local dev JWT secret (application.properties default) ───────────────────
const SECRET = 'changeme-this-must-be-at-least-256-bits-long-secret-key'

// ── User info ────────────────────────────────────────────────────────────────
const USER_ID = 1
const EMAIL = 'raj.selvaraj.arch@gmail.com'

// ── JWT utilities ────────────────────────────────────────────────────────────
function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

function createJwt(userId, email, secretStr) {
  const key = Buffer.from(secretStr, 'utf8')  // 65 bytes → HS512

  // JJWT uses HmacSHA512 when key >= 512 bits (64 bytes); our key is 65 bytes
  const hmacAlg = key.length >= 64 ? 'sha512' : key.length >= 48 ? 'sha384' : 'sha256'
  const jwtAlg  = key.length >= 64 ? 'HS512'  : key.length >= 48 ? 'HS384'  : 'HS256'

  const now = Math.floor(Date.now() / 1000)
  const header  = b64url(JSON.stringify({ alg: jwtAlg, typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    sub:    email,
    userId: userId,
    iat:    now,
    exp:    now + 86400,   // 24 hours
  }))

  const signingInput = `${header}.${payload}`
  const sig = crypto.createHmac(hmacAlg, key).update(signingInput).digest('base64url')

  return `${signingInput}.${sig}`
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function get(url, token) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: { Authorization: `Bearer ${token}` } }, res => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body))
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`))
        }
      })
    })
    req.on('error', reject)
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
;(async () => {
  console.log('\n[dev-token] Generating local dev JWT...')
  const token = createJwt(USER_ID, EMAIL, SECRET)

  console.log('[dev-token] Verifying token against local backend...')
  let user
  try {
    user = await get(`${BACKEND}/api/auth/me`, token)
  } catch (err) {
    console.error('\n[dev-token] ERROR: Token verification failed.')
    console.error('  ', err.message)
    console.error('\n  Is the backend running on port 8080?')
    console.error('  If using a custom JWT_SECRET, set it in the DO_AUTH_SECRET env var:\n')
    console.error('    DO_AUTH_SECRET="your-secret" node tests/make-dev-token.cjs\n')
    process.exit(1)
  }

  console.log(`[dev-token] Verified as: ${user.email} (id=${user.id}, admin=${user.admin})`)

  // Build Playwright storageState format
  const state = {
    cookies: [],
    origins: [
      {
        origin: FRONTEND_ORIGIN,
        localStorage: [{ name: 'pianorep_token', value: token }],
      },
    ],
  }

  mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  console.log(`[dev-token] Auth state saved to ${STATE_FILE}\n`)
  process.exit(0)
})().catch(err => {
  console.error('[dev-token] Unexpected error:', err.message)
  process.exit(1)
})
