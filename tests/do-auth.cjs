/**
 * Standalone auth pre-script (CommonJS, run via `node tests/do-auth.cjs`).
 *
 * Opens a Chrome window at the PianoRep login page so you can complete
 * Google sign-in with raj.selvaraj.arch@gmail.com, then saves browser
 * auth state to tests/.auth/state.json for use by the Playwright tests.
 *
 * Subsequent runs detect the saved file and exit immediately.
 * Called automatically by `npm run test:search`.
 *
 * If you need to refresh auth, delete tests/.auth/state.json and re-run.
 */

const { chromium } = require('@playwright/test')
const { existsSync, mkdirSync } = require('fs')
const path = require('path')

const STATE_FILE = path.resolve(__dirname, '.auth', 'state.json')
const BASE_URL = 'http://localhost:5173'

;(async () => {
  if (existsSync(STATE_FILE)) {
    console.log('\n[auth] Saved state found — skipping login.\n')
    process.exit(0)
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(' FIRST-TIME AUTH SETUP')
  console.log(' ─────────────────────────────────────────────────────────────')
  console.log(' A Chrome window will open at the PianoRep login page.')
  console.log(' Please:')
  console.log('   1. Click the "Sign in with Google" button')
  console.log('   2. Select / sign in as: raj.selvaraj.arch@gmail.com')
  console.log('   3. Wait for the catalog page to load')
  console.log(' Chrome will close automatically and tests will begin.')
  console.log(' (You have 2 minutes to complete this.)')
  console.log('═══════════════════════════════════════════════════════════════\n')

  // Launch Chromium (bundled with Playwright) — avoids system Chrome quirks
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',   // reduces Google bot-detection
    ],
    ignoreDefaultArgs: ['--enable-automation'],           // removes "Chrome is being controlled" banner
  })

  const ctx = await browser.newContext({
    viewport: null,   // use full window size (set by --start-maximized)
  })
  const page = await ctx.newPage()

  // Navigate to login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })

  // Wait for the Google login button to appear
  await page.waitForSelector('iframe', { timeout: 30_000 }).catch(() => {
    // Button might not be in an iframe in all versions — ignore
  })

  console.log('[auth] Login page loaded. Waiting for you to sign in...\n')

  // Poll for the JWT token in localStorage — handles both popup and redirect flows.
  // We use a loop so we survive any page navigations that occur during OAuth.
  const deadline = Date.now() + 120_000
  let token = null

  while (Date.now() < deadline) {
    try {
      token = await page.evaluate(() => localStorage.getItem('pianorep_token'))
      if (token) break
    } catch {
      // Page may be mid-navigation; continue polling
    }
    await new Promise(r => setTimeout(r, 1_000))   // poll every second
  }

  if (!token) {
    await browser.close()
    console.error('\n[auth] ERROR: Timed out waiting for Google login (2 min exceeded).')
    console.error('       Please re-run and complete sign-in within 2 minutes.\n')
    process.exit(1)
  }

  // Give React a moment to finish navigating to /catalog
  await page.waitForURL(`${BASE_URL}/catalog`, { timeout: 15_000 }).catch(() => {})

  mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  await ctx.storageState({ path: STATE_FILE })

  console.log('\n[auth] Signed in successfully! Auth state saved.')
  console.log('[auth] Future runs will skip this step.\n')
  await browser.close()
  process.exit(0)
})().catch(err => {
  console.error('\n[auth] Unexpected error:', err.message)
  process.exit(1)
})
