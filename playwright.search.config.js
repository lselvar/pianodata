/**
 * Playwright config for real-backend Search & Filter tests.
 *
 * Usage:
 *   npm run test:search
 *
 * Auth is handled by tests/do-auth.cjs (runs first via npm pre-script).
 * The saved state lives in tests/.auth/state.json (git-ignored).
 *
 * Prerequisites:
 *   - Frontend: npm run dev  (port 5173)
 *   - Backend:  mvn spring-boot:run  (port 8080)
 */

import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'path'

const AUTH_STATE = resolve('tests/.auth/state.json')

export default defineConfig({
  testDir: './tests',
  testMatch: '**/search.spec.js',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,

  reporter: [
    ['list'],
    ['html', { open: 'on-failure', outputFolder: 'playwright-report-search' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    headless: false,
    storageState: AUTH_STATE,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
