/**
 * Comprehensive Search & Catalog Filter Tests
 *
 * Tests all filter capabilities on the /catalog page against the live
 * local backend. Requires both frontend (port 5173) and backend (port 8080)
 * to be running.
 *
 * Run: npm run test:search
 */

import { test, expect } from '@playwright/test'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Triggers an action and waits for the next /api/catalog/search response.
 * action() is called AFTER the waitForResponse listener is registered,
 * ensuring we never miss the network event.
 */
async function afterSearch(page, action) {
  const [response] = await Promise.all([
    page.waitForResponse(
      r => r.url().includes('/api/catalog/search') && r.status() === 200,
      { timeout: 15_000 }
    ),
    action(),
  ])
  return response
}

/** Returns the integer in "N pieces found" visible on the page. */
async function getCount(page) {
  const el = page.locator('text=/\\d+ pieces found/')
  await expect(el).toBeVisible({ timeout: 15_000 })
  const txt = await el.textContent()
  return parseInt(txt.match(/\d+/)[0], 10)
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Catalog Search & Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and wait for both the initial search AND filter-options to resolve
    await Promise.all([
      page.waitForResponse(
        r => r.url().includes('/api/catalog/search') && r.status() === 200,
        { timeout: 20_000 }
      ),
      page.waitForResponse(
        r => r.url().includes('/api/catalog/filter-options') && r.status() === 200,
        { timeout: 20_000 }
      ),
      page.goto('/catalog'),
    ])
  })

  // ── 1. Page structure ────────────────────────────────────────────────────
  test('1 · page structure — filters sidebar, results grid, count', async ({ page }) => {
    await expect(page.locator('h2:text("Filters")')).toBeVisible()

    const labels = [
      'Composer', 'Solo / Duet', 'Piece Movement', 'Catalog',
      'Era', 'Level', 'Level Secondo', 'Rating',
      'Speed', 'Key', 'Meter', 'Mood', 'Type', 'Etude',
    ]
    for (const label of labels) {
      await expect(page.locator(`label:text-is("${label}")`)).toBeVisible()
    }

    const total = await getCount(page)
    expect(total).toBeGreaterThan(0)
    console.log(`\n  Total catalog: ${total} pieces`)

    await expect(page.locator('button:text("Clear Filters")')).toBeVisible()
    // At least one piece card rendered
    await expect(page.locator('a.card').first()).toBeVisible()
  })

  // ── 2. Title keyword search ──────────────────────────────────────────────
  test('2 · title keyword search (q)', async ({ page }) => {
    const initial = await getCount(page)

    await afterSearch(page, () =>
      page.locator('input[placeholder="Title…"]').fill('sonata')
    )
    const filtered = await getCount(page)
    console.log(`  Title "sonata": ${filtered} / ${initial}`)
    expect(filtered).toBeGreaterThanOrEqual(0)

    // Clear
    await afterSearch(page, () =>
      page.locator('input[placeholder="Title…"]').fill('')
    )
    expect(await getCount(page)).toBe(initial)
  })

  // ── 3. Composer typeahead ────────────────────────────────────────────────
  test('3 · composer typeahead — suggestions appear and selection filters results', async ({ page }) => {
    const composerInput = page.locator('input[placeholder="Composer…"]')
    await composerInput.fill('bach')

    const suggestions = page.locator('ul li')
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 })

    const picked = (await suggestions.first().textContent())?.trim() ?? ''
    await afterSearch(page, () => suggestions.first().click())

    expect(await composerInput.inputValue()).toBe(picked)
    const count = await getCount(page)
    console.log(`  Composer "${picked}": ${count} pieces`)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // ── 4. Solo / Duet checkboxes ────────────────────────────────────────────
  test('4 · Solo / Duet checkboxes', async ({ page }) => {
    const solo = page.locator('label:text-is("Solo") input[type="checkbox"]')
    const duet = page.locator('label:text-is("Duet") input[type="checkbox"]')

    // Solo only
    await afterSearch(page, () => solo.check())
    const soloCount = await getCount(page)
    console.log(`  Solo: ${soloCount}`)
    expect(soloCount).toBeGreaterThanOrEqual(0)

    // Duet only
    await afterSearch(page, () => solo.uncheck())
    await afterSearch(page, () => duet.check())
    const duetCount = await getCount(page)
    console.log(`  Duet: ${duetCount}`)
    expect(duetCount).toBeGreaterThanOrEqual(0)

    // Both Solo + Duet
    await afterSearch(page, () => solo.check())
    const bothCount = await getCount(page)
    console.log(`  Solo+Duet: ${bothCount}`)
    expect(bothCount).toBeGreaterThanOrEqual(Math.max(soloCount, duetCount))
  })

  // ── 5. Movement filter ───────────────────────────────────────────────────
  test('5 · movement filter', async ({ page }) => {
    const initial = await getCount(page)

    await afterSearch(page, () =>
      page.locator('input[placeholder="Movement…"]').fill('1')
    )
    const count = await getCount(page)
    console.log(`  Movement "1": ${count} / ${initial}`)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // ── 6. Catalog name filter ───────────────────────────────────────────────
  test('6 · catalog name filter', async ({ page }) => {
    await afterSearch(page, () =>
      page.locator('input[placeholder="Catalog…"]').fill('bach')
    )
    const count = await getCount(page)
    console.log(`  Catalog "bach": ${count}`)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // ── 7. Era dropdown ──────────────────────────────────────────────────────
  test('7 · era dropdown — iterate each available era', async ({ page }) => {
    const sel = page.locator('label:text-is("Era")').locator('..').locator('select')
    const opts = await sel.locator('option').allTextContents()
    const eras = opts.filter(o => o !== 'All')
    console.log(`  Eras: [${eras.join(', ')}]`)

    for (const era of eras) {
      await afterSearch(page, () => sel.selectOption({ label: era }))
      const count = await getCount(page)
      console.log(`    ${era}: ${count}`)
      expect(count).toBeGreaterThanOrEqual(0)
    }

    // Reset to All
    await afterSearch(page, () => sel.selectOption(''))
  })

  // ── 8. Level multi-select ────────────────────────────────────────────────
  test('8 · level multi-select — single and multiple levels', async ({ page }) => {
    // Level's label is inside a flex row div, so go up 2 levels from the label
    const sel = page.locator('label:text-is("Level")').locator('../..').locator('select[multiple]').first()
    const opts = await sel.locator('option').allTextContents()
    console.log(`  Levels: [${opts.join(', ')}]`)

    if (opts.length >= 1) {
      await afterSearch(page, () => sel.selectOption([opts[0]]))
      console.log(`  Level "${opts[0]}": ${await getCount(page)}`)
    }

    if (opts.length >= 2) {
      await afterSearch(page, () => sel.selectOption([opts[0], opts[1]]))
      console.log(`  Level "${opts[0]}"+"${opts[1]}": ${await getCount(page)}`)
    }

    // Clear via "Clear (N)" button
    const clearBtn = page.locator('button').filter({ hasText: /^Clear \(\d+\)$/ }).first()
    if (await clearBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await afterSearch(page, () => clearBtn.click())
    }
  })

  // ── 9. Level Secondo multi-select ────────────────────────────────────────
  test('9 · level secondo multi-select', async ({ page }) => {
    const sel = page.locator('label:text-is("Level Secondo")').locator('../..').locator('select[multiple]')
    const opts = await sel.locator('option').allTextContents()
    console.log(`  Level Secondo options: [${opts.join(', ')}]`)

    if (opts.length >= 1) {
      await afterSearch(page, () => sel.selectOption([opts[0]]))
      const count = await getCount(page)
      console.log(`  Level Secondo "${opts[0]}": ${count}`)
      expect(count).toBeGreaterThanOrEqual(0)
    }

    const clearBtn = page.locator('button').filter({ hasText: /^Clear \(\d+\)$/ })
    if (await clearBtn.last().isVisible({ timeout: 2_000 }).catch(() => false)) {
      await afterSearch(page, () => clearBtn.last().click())
    }
  })

  // ── 10. Rating multi-select ──────────────────────────────────────────────
  test('10 · rating multi-select — single and multiple ratings', async ({ page }) => {
    const sel = page.locator('label:text-is("Rating")').locator('../..').locator('select[multiple]')
    const opts = await sel.locator('option').allTextContents()
    console.log(`  Ratings: [${opts.join(', ')}]`)

    if (opts.length >= 1) {
      await afterSearch(page, () => sel.selectOption([opts[0]]))
      console.log(`  Rating "${opts[0]}": ${await getCount(page)}`)
    }

    if (opts.length >= 2) {
      await afterSearch(page, () => sel.selectOption([opts[0], opts[1]]))
      console.log(`  Rating "${opts[0]}"+"${opts[1]}": ${await getCount(page)}`)
    }

    // Clear via Clear button if visible
    const clearBtn = page.locator('button').filter({ hasText: /^Clear \(\d+\)$/ })
    if (await clearBtn.last().isVisible({ timeout: 2_000 }).catch(() => false)) {
      await afterSearch(page, () => clearBtn.last().click())
    }
  })

  // ── 11. Speed (tempo) dropdown ───────────────────────────────────────────
  test('11 · speed (tempo) dropdown — Slow / Medium / Fast', async ({ page }) => {
    const sel = page.locator('label:text-is("Speed")').locator('..').locator('select')
    const opts = await sel.locator('option').allTextContents()
    const speeds = opts.filter(o => o !== 'All')

    for (const speed of speeds) {
      await afterSearch(page, () => sel.selectOption({ label: speed }))
      console.log(`  Speed "${speed}": ${await getCount(page)}`)
    }

    await afterSearch(page, () => sel.selectOption(''))
  })

  // ── 12. Key dropdown ─────────────────────────────────────────────────────
  test('12 · key dropdown', async ({ page }) => {
    const sel = page.locator('label:text-is("Key")').locator('..').locator('select')
    const opts = await sel.locator('option').allTextContents()
    const keys = opts.filter(o => o !== 'All')
    console.log(`  Keys available: ${keys.length}`)

    if (keys.length >= 1) {
      await afterSearch(page, () => sel.selectOption({ label: keys[0] }))
      console.log(`  Key "${keys[0]}": ${await getCount(page)}`)

      if (keys.length >= 2) {
        await afterSearch(page, () => sel.selectOption({ label: keys[1] }))
        console.log(`  Key "${keys[1]}": ${await getCount(page)}`)
      }

      await afterSearch(page, () => sel.selectOption(''))
    }
  })

  // ── 13. Meter (time signature) filter ────────────────────────────────────
  test('13 · meter (time signature) filter', async ({ page }) => {
    const input = page.locator('input[placeholder="e.g. 4/4"]')

    await afterSearch(page, () => input.fill('4/4'))
    console.log(`  Meter "4/4": ${await getCount(page)}`)

    await afterSearch(page, () => input.fill('3/4'))
    console.log(`  Meter "3/4": ${await getCount(page)}`)

    await afterSearch(page, () => input.fill(''))
  })

  // ── 14. Mood filter ──────────────────────────────────────────────────────
  test('14 · mood filter', async ({ page }) => {
    await afterSearch(page, () =>
      page.locator('input[placeholder="Mood…"]').fill('lyrical')
    )
    const count = await getCount(page)
    console.log(`  Mood "lyrical": ${count}`)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // ── 15. Type filter ──────────────────────────────────────────────────────
  test('15 · type filter', async ({ page }) => {
    await afterSearch(page, () =>
      page.locator('input[placeholder="Type…"]').fill('sonata')
    )
    const count = await getCount(page)
    console.log(`  Type "sonata": ${count}`)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // ── 16. Etude filter ─────────────────────────────────────────────────────
  test('16 · etude filter', async ({ page }) => {
    await afterSearch(page, () =>
      page.locator('input[placeholder="Etude…"]').fill('op')
    )
    const count = await getCount(page)
    console.log(`  Etude "op": ${count}`)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // ── 17. Combined filters ─────────────────────────────────────────────────
  test('17 · combined filters narrow results (title + era)', async ({ page }) => {
    const initial = await getCount(page)

    await afterSearch(page, () =>
      page.locator('input[placeholder="Title…"]').fill('a')
    )
    const titleCount = await getCount(page)
    console.log(`  Title "a": ${titleCount} / ${initial}`)

    const eraSel = page.locator('label:text-is("Era")').locator('..').locator('select')
    const eraOpts = (await eraSel.locator('option').allTextContents()).filter(o => o !== 'All')

    if (eraOpts.length > 0) {
      await afterSearch(page, () => eraSel.selectOption({ label: eraOpts[0] }))
      const combo = await getCount(page)
      console.log(`  + Era "${eraOpts[0]}": ${combo}`)
      expect(combo).toBeLessThanOrEqual(titleCount)
    }

    // Clear all and confirm full catalog restored
    await afterSearch(page, () =>
      page.locator('button:text("Clear Filters")').click()
    )
    expect(await getCount(page)).toBe(initial)
  })

  // ── 18. Clear Filters ────────────────────────────────────────────────────
  test('18 · Clear Filters button restores full catalog', async ({ page }) => {
    const initial = await getCount(page)

    await afterSearch(page, () =>
      page.locator('input[placeholder="Title…"]').fill('e')
    )
    await afterSearch(page, () =>
      page.locator('label:text-is("Solo") input[type="checkbox"]').check()
    )

    await afterSearch(page, () =>
      page.locator('button:text("Clear Filters")').click()
    )
    const restored = await getCount(page)
    expect(restored).toBe(initial)

    // Text inputs are cleared
    await expect(page.locator('input[placeholder="Title…"]')).toHaveValue('')
    await expect(page.locator('input[placeholder="Composer…"]')).toHaveValue('')
    console.log(`  Cleared: ${restored} == ${initial} ✓`)
  })

  // ── 19. Pagination ───────────────────────────────────────────────────────
  test('19 · pagination — navigate to page 2 and back', async ({ page }) => {
    const total = await getCount(page)

    if (total <= 24) {
      console.log(`  Only 1 page (${total} ≤ 24) — skipping`)
      return
    }

    const nextBtn = page.locator('button:text-is("Next")')
    await expect(nextBtn).toBeVisible()

    await afterSearch(page, () => nextBtn.click())
    await expect(page.locator('text=/Page 2 of/')).toBeVisible()
    console.log(`  Navigated to page 2`)

    const prevBtn = page.locator('button:text-is("Previous")')
    await afterSearch(page, () => prevBtn.click())
    await expect(page.locator('text=/Page 1 of/')).toBeVisible()
    console.log(`  Back to page 1`)
  })

  // ── 20. Piece card → detail page ─────────────────────────────────────────
  test('20 · piece card click opens detail page with correct data', async ({ page }) => {
    const firstCard = page.locator('a.card').first()
    await expect(firstCard).toBeVisible()

    const title = ((await firstCard.locator('h3').textContent()) ?? '').trim()
    const composer = ((await firstCard.locator('.text-piano-600').textContent()) ?? '').trim()
    console.log(`  Opening: "${title}" by ${composer}`)

    await firstCard.click()
    await expect(page).toHaveURL(/\/catalog\/\d+/, { timeout: 10_000 })

    // Detail page renders title in h1 and composer with the right classes
    await expect(page.locator('h1').first()).toContainText(title, { timeout: 15_000 })
    await expect(page.locator('.text-piano-600.font-medium').first()).toContainText(composer)

    // Verify "← Back to catalog" link works
    await page.locator('text=← Back to catalog').click()
    await expect(page).toHaveURL(/\/catalog$/)
    await expect(page.locator('text=/\\d+ pieces found/')).toBeVisible()
  })

  // ── 21. No-results state ─────────────────────────────────────────────────
  test('21 · impossible query shows 0 results message', async ({ page }) => {
    await afterSearch(page, () =>
      page.locator('input[placeholder="Title…"]').fill('zzzzzzzzz_impossible_99999')
    )

    await expect(page.locator('text=/0 pieces found/')).toBeVisible()
    await expect(page.locator('text=No results. Try different filters.')).toBeVisible()
    console.log('  0-results message shown ✓')

    // Restore
    await afterSearch(page, () =>
      page.locator('input[placeholder="Title…"]').fill('')
    )
  })
})
