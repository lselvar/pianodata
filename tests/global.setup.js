/**
 * Global auth setup — runs once before the search test suite.
 *
 * First run:  Opens Chrome so you can complete Google sign-in with
 *             raj.selvaraj.arch@gmail.com, then saves auth state.
 * Later runs: Detects saved state and skips login entirely.
 *
 * State file: tests/.auth/state.json  (git-ignored)
 */

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const STATE_FILE = resolve(__dir, '.auth', 'state.json')

export default async function globalSetup() {
  if (existsSync(STATE_FILE)) {
    console.log('\n[auth setup] Saved state found — skipping login.\n')
    return
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log(' First-time setup: Chrome will open for Google login')
  console.log(' Please sign in with: raj.selvaraj.arch@gmail.com')
  console.log(' Tests will start automatically after you log in.')
  console.log('═══════════════════════════════════════════════════\n')

  const browser = await chromium.launch({ channel: 'chrome', headless: false })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  await page.goto('http://localhost:5173/login')

  // Wait up to 2 minutes for pianorep_token to appear in localStorage
  await page.waitForFunction(
    () => !!window.localStorage.getItem('pianorep_token'),
    { timeout: 120_000 }
  )
  await page.waitForURL('**/catalog', { timeout: 30_000 })

  mkdirSync(dirname(STATE_FILE), { recursive: true })
  await ctx.storageState({ path: STATE_FILE })

  console.log('\n[auth setup] Auth state saved — you only need to do this once.\n')
  await browser.close()
}
