import { test, expect } from '@playwright/test'

// ── Mock data ──────────────────────────────────────────────────────────────────

const ADMIN_USER = {
  id: 1,
  email: 'raj.selvaraj.arch@gmail.com',
  displayName: 'Raj Selvaraj',
  avatarUrl: null,
  roles: ['ROLE_USER', 'ROLE_ADMIN'],
  subscriptionStatus: 'ACTIVE',
  admin: true,
  trialDaysRemaining: null,
}

const REGULAR_USER = {
  id: 2,
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: null,
  roles: ['ROLE_USER'],
  subscriptionStatus: 'TRIAL',
  admin: false,
  trialDaysRemaining: 5,
}

const CATALOG_PAGE = {
  content: [
    {
      id: 548,
      title: 'Variations on a Theme',
      movement: '1',
      composer: 'Adam, Louis',
      originalSource: 'Haydn, Josef',
      catalogName: 'Classical Favorites',
      era: 'C',
      level: 'Intermediate',
      tempoSpeed: 'M',
      incipit: null,
    },
    {
      id: 543,
      title: 'Sonata in C Major',
      movement: '1',
      composer: 'Bach, J.S.',
      originalSource: null,
      catalogName: 'Bach Collection',
      era: 'B',
      level: 'Advanced',
      tempoSpeed: 'F',
      incipit: null,
    },
  ],
  page: 0, size: 24, totalElements: 2, totalPages: 1,
  hasNext: false, hasPrevious: false,
}

const FILTER_OPTIONS = {
  composers: ['Adam, Louis', 'Bach, J.S.'],
  eras: [],
  eraLabels: { B: 'Baroque', C: 'Classical', R: 'Romantic', M: 'Modern', CO: 'Contemporary' },
  keys: ['C major', 'D major'],
  tempoSpeeds: ['S', 'M', 'F'],
  levels: ['Beginner', 'Intermediate', 'Advanced'],
}

const PIECE_DETAIL = {
  id: 548,
  title: 'Variations on a Theme',
  movement: '1',
  composer: 'Adam, Louis',
  originalSource: 'Haydn, Josef',
  catalogName: 'Classical Favorites',
  era: 'C',
  keyName: 'C major',
  tempo: 'Andante',
  tempoSpeed: 'M',
  level: 'Intermediate',
  incipit: null,
}

const USERS_PAGE = {
  content: [
    {
      id: 1,
      email: 'raj.selvaraj.arch@gmail.com',
      displayName: 'Raj Selvaraj',
      avatarUrl: null,
      admin: true,
      subscriptionStatus: 'ACTIVE',
      trialDaysRemaining: null,
      trialStartDate: null,
      currentPeriodEnd: '2025-01-01T00:00:00',
      lastLoginAt: '2024-03-01T10:00:00',
    },
    {
      id: 2,
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      admin: false,
      subscriptionStatus: 'TRIAL',
      trialDaysRemaining: 5,
      trialStartDate: '2024-02-15T00:00:00',
      currentPeriodEnd: null,
      lastLoginAt: '2024-02-20T09:30:00',
    },
  ],
  page: 0, size: 25, totalElements: 2, totalPages: 1,
  hasNext: false, hasPrevious: false,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Mocks /api/auth/me and seeds localStorage — bypasses Google OAuth. */
async function loginAs(page, user) {
  await page.route('**/api/auth/me', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  )
  await page.addInitScript(u => {
    localStorage.setItem('pianorep_token', 'test-token-' + u.id)
  }, user)
}

/** Mocks all catalog data endpoints so the fake JWT doesn't cause 401s. */
async function mockCatalogAPIs(page) {
  await page.route('**/api/catalog/filter-options', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FILTER_OPTIONS) })
  )
  await page.route('**/api/catalog/search**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG_PAGE) })
  )
  // Match any piece detail: /api/catalog/<number>
  await page.route(/\/api\/catalog\/\d+$/, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PIECE_DETAIL) })
  )
}

/** Mocks the admin users endpoint. */
async function mockAdminAPIs(page) {
  await page.route('**/api/admin/users**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USERS_PAGE) })
  )
}

// ── 1. Login Page ──────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test('shows PianoRep branding and Google sign-in button', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'PianoRep' })).toBeVisible()
    await expect(page.getByText('Sign in with Google to get started')).toBeVisible()
    await expect(page.getByText('7-day free trial')).toBeVisible()

    // Google OAuth iframe is injected by @react-oauth/google — it renders hidden
    // in headless, so we verify it's in the DOM rather than visible.
    await expect(
      page.locator('iframe[title="Sign in with Google Button"]')
    ).toBeAttached()
  })

  test('redirects authenticated user from /login to /catalog', async ({ page }) => {
    await loginAs(page, REGULAR_USER)
    await mockCatalogAPIs(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/catalog/)
  })

  test('unauthenticated user is redirected to /login from protected route', async ({ page }) => {
    await page.goto('/catalog')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── 2. Catalog ─────────────────────────────────────────────────────────────────

test.describe('Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, REGULAR_USER)
    await mockCatalogAPIs(page)
  })

  test('loads catalog page with filters sidebar and piece count', async ({ page }) => {
    await page.goto('/catalog')

    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible()
    await expect(page.getByPlaceholder('Title…')).toBeVisible()
    await expect(page.getByText('2 pieces found')).toBeVisible()
  })

  test('renders piece cards with title and composer', async ({ page }) => {
    await page.goto('/catalog')

    const cards = page.locator('a[href^="/catalog/"]')
    await expect(cards).toHaveCount(2)

    // First card: Adam piece with arranged-from
    const firstCard = cards.nth(0)
    await expect(firstCard.locator('h3')).toHaveText('Variations on a Theme')
    await expect(firstCard.getByText('Adam, Louis')).toBeVisible()
    await expect(firstCard.getByText('arr. Haydn, Josef')).toBeVisible()

    // Second card: Bach piece with no arranged-from
    const secondCard = cards.nth(1)
    await expect(secondCard.locator('h3')).toHaveText('Sonata in C Major')
    await expect(secondCard.getByText('Bach, J.S.')).toBeVisible()
    await expect(secondCard.locator('text=/^arr\\. /')).toHaveCount(0)
  })

  test('typing in the search input triggers a new search', async ({ page }) => {
    await page.goto('/catalog')
    await expect(page.getByText('2 pieces found')).toBeVisible()

    // Return a single result on subsequent calls
    await page.route('**/api/catalog/search**', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ ...CATALOG_PAGE, content: [CATALOG_PAGE.content[0]], totalElements: 1 }),
      })
    )
    await page.getByPlaceholder('Title…').fill('Bach')
    await expect(page.getByText('1 pieces found')).toBeVisible()
  })

  test('clicking a card opens the piece detail page', async ({ page }) => {
    await page.goto('/catalog')

    await page.locator('a[href^="/catalog/"]').first().click()
    await expect(page).toHaveURL(/\/catalog\/\d+/)
    await expect(page.getByRole('heading', { name: 'Variations on a Theme' })).toBeVisible()
    await expect(page.getByText('← Back to catalog')).toBeVisible()
  })

  test('Back from a piece restores the previous filters and results', async ({ page }) => {
    await page.goto('/catalog')
    await expect(page.getByText('2 pieces found')).toBeVisible()

    // Narrow the search to a single result
    await page.route('**/api/catalog/search**', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ ...CATALOG_PAGE, content: [CATALOG_PAGE.content[0]], totalElements: 1 }),
      })
    )
    const searchBox = page.getByPlaceholder('Title…')
    await searchBox.fill('Adam')
    await expect(page.getByText('1 pieces found')).toBeVisible()

    // Open the piece, then go back
    await page.locator('a[href^="/catalog/"]').first().click()
    await expect(page).toHaveURL(/\/catalog\/\d+/)
    await page.getByText('← Back to catalog').click()

    await expect(page).toHaveURL(/\/catalog$/)
    await expect(searchBox).toHaveValue('Adam')
    await expect(page.getByText('1 pieces found')).toBeVisible()
  })

  test('piece detail shows composer and arranged-from separately', async ({ page }) => {
    await page.goto('/catalog/548')

    // Composer shown as clean name — no ", arr." suffix
    const composer = page.locator('p.text-piano-600.font-medium')
    await expect(composer).toHaveText('Adam, Louis')
    expect(await composer.textContent()).not.toContain(', arr.')

    // Arranged-from shown as a separate line
    await expect(page.getByText('arr. Haydn, Josef')).toBeVisible()
  })

  test('piece detail shows musical details grid', async ({ page }) => {
    await page.goto('/catalog/548')

    await expect(page.getByText('Era')).toBeVisible()
    await expect(page.getByText('Key')).toBeVisible()
    await expect(page.getByText('Level')).toBeVisible()
  })
})

// ── 3. Admin — Catalog ─────────────────────────────────────────────────────────

test.describe('Admin — Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_USER)
    await mockCatalogAPIs(page)
  })

  test('admin user sees Admin and Users nav links', async ({ page }) => {
    await page.goto('/catalog')
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible()
  })

  test('loads admin catalog page with entries table', async ({ page }) => {
    await page.goto('/admin/catalog')

    await expect(page.getByRole('heading', { name: /Admin — Catalog/i })).toBeVisible()
    await expect(page.getByRole('link', { name: '+ New Entry' })).toBeVisible()

    await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Composer' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Era' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Level' })).toBeVisible()

    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(2)
  })

  test('shows arranged-from as sub-line under composer in table', async ({ page }) => {
    await page.goto('/admin/catalog')

    // Adam piece in row — arranger shown under composer
    const composerCell = page.locator('tbody tr').nth(0).locator('td').nth(2)
    await expect(composerCell.getByText('Adam, Louis')).toBeVisible()
    await expect(composerCell.getByText('arr. Haydn, Josef')).toBeVisible()

    // Bach piece row has no arranged-from
    const bachCell = page.locator('tbody tr').nth(1).locator('td').nth(2)
    await expect(bachCell.locator('text=/^arr\\. /')).toHaveCount(0)
  })

  test('Back from editing an entry restores the admin search and results', async ({ page }) => {
    await page.route(/\/api\/admin\/catalog\/\d+$/, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PIECE_DETAIL) })
    )
    await page.goto('/admin/catalog')
    await expect(page.locator('tbody tr')).toHaveCount(2)

    // Narrow the search to a single result
    await page.route('**/api/catalog/search**', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ ...CATALOG_PAGE, content: [CATALOG_PAGE.content[0]], totalElements: 1 }),
      })
    )
    const searchBox = page.getByPlaceholder('Search by Composer, Catalog, Title')
    await searchBox.fill('Adam sonata')
    await expect(page.locator('tbody tr')).toHaveCount(1)

    // Open the editor, then go back
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await expect(page).toHaveURL(/\/admin\/catalog\/\d+\/edit/)
    await page.goBack()

    await expect(page).toHaveURL(/\/admin\/catalog$/)
    await expect(searchBox).toHaveValue('Adam sonata')
    await expect(page.locator('tbody tr')).toHaveCount(1)
  })

  test('opens the new entry form with all required fields', async ({ page }) => {
    await page.goto('/admin/catalog')
    await page.getByRole('link', { name: '+ New Entry' }).click()

    await expect(page).toHaveURL(/\/admin\/catalog\/new/)
    await expect(page.getByRole('heading', { name: 'New Entry' })).toBeVisible()

    // Check required field labels are present
    await expect(page.getByText('Title *')).toBeVisible()
    await expect(page.getByText('Composer *')).toBeVisible()
    await expect(page.getByText('Catalog Name *')).toBeVisible()

    // Original Source field
    await expect(page.getByText('Original Source')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. Folk - German')).toBeVisible()
  })

  test('opens edit form pre-filled for an existing entry', async ({ page }) => {
    await page.goto('/admin/catalog')

    await page.getByRole('button', { name: 'Edit' }).first().click()
    await expect(page).toHaveURL(/\/admin\/catalog\/\d+\/edit/)
    await expect(page.getByRole('heading', { name: 'Edit Entry' })).toBeVisible()

    // Original Source should be pre-filled with existing data
    await expect(page.getByPlaceholder('e.g. Folk - German')).toHaveValue('Haydn, Josef')
  })

  test('non-admin is redirected away from admin page', async ({ page }) => {
    await page.route('**/api/auth/me', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REGULAR_USER) })
    )
    await page.goto('/admin/catalog')
    await expect(page).toHaveURL(/\/catalog/)
  })
})

// ── 4. Admin — Users ───────────────────────────────────────────────────────────

test.describe('Admin — Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_USER)
    await mockAdminAPIs(page)
  })

  test('loads users page with heading and table headers', async ({ page }) => {
    await page.goto('/admin/users')

    await expect(page.getByRole('heading', { name: /Admin — Users/i })).toBeVisible()
    await expect(page.getByText('2 total users')).toBeVisible()

    await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Subscription' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Last Login' })).toBeVisible()
  })

  test('shows user rows with name, role and subscription status', async ({ page }) => {
    await page.goto('/admin/users')

    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(2)

    // Admin row
    const adminRow = rows.nth(0)
    await expect(adminRow.getByText('Raj Selvaraj')).toBeVisible()
    await expect(adminRow.getByText('Admin')).toBeVisible()
    await expect(adminRow.getByText('ACTIVE')).toBeVisible()

    // Regular user row
    const userRow = rows.nth(1)
    await expect(userRow.getByText('Test User')).toBeVisible()
    await expect(userRow.getByText('TRIAL')).toBeVisible()
  })

  test('search input is visible and functional', async ({ page }) => {
    await page.goto('/admin/users')

    const searchInput = page.getByPlaceholder('Search by name or email…')
    await expect(searchInput).toBeVisible()

    // Narrow results on search
    await page.route('**/api/admin/users**', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ ...USERS_PAGE, content: [USERS_PAGE.content[0]], totalElements: 1 }),
      })
    )
    await searchInput.fill('raj')
    await expect(page.getByText('1 total users')).toBeVisible()
  })

  test('edit button shows inline Save/Cancel, Cancel restores the row', async ({ page }) => {
    await page.goto('/admin/users')

    await page.getByRole('button', { name: 'Edit' }).first().click()

    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit' }).first()).toBeVisible()
  })
})

// ── 4b. Admin — Bulk Resource Link Editing ────────────────────────────────────

test.describe('Admin — Bulk Resource Link Editing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_USER)
    await mockCatalogAPIs(page)
    await page.goto('/admin/catalog')
    await expect(page.locator('tbody tr')).toHaveCount(2)
  })

  test('checkbox column is visible in the table header and rows', async ({ page }) => {
    // Header checkbox (select-all)
    await expect(page.locator('thead input[type="checkbox"]')).toBeVisible()
    // Each row has a checkbox
    const rowCheckboxes = page.locator('tbody tr input[type="checkbox"]')
    await expect(rowCheckboxes).toHaveCount(2)
  })

  test('bulk action bar is hidden when nothing is selected', async ({ page }) => {
    await expect(page.getByText(/entries selected/)).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit Resource Links' })).not.toBeVisible()
  })

  test('selecting one entry shows the bulk action bar', async ({ page }) => {
    const firstCheckbox = page.locator('tbody tr').first().locator('input[type="checkbox"]')
    await firstCheckbox.check()

    await expect(page.getByText('1 entry selected')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit Resource Links' })).toBeVisible()
  })

  test('selecting both entries shows correct count in action bar', async ({ page }) => {
    const headerCheckbox = page.locator('thead input[type="checkbox"]')
    await headerCheckbox.check()

    await expect(page.getByText('2 entries selected')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit Resource Links' })).toBeVisible()
  })

  test('Clear link deselects all entries and hides action bar', async ({ page }) => {
    const headerCheckbox = page.locator('thead input[type="checkbox"]')
    await headerCheckbox.check()
    await expect(page.getByText('2 entries selected')).toBeVisible()

    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByText(/entries selected/)).not.toBeVisible()
  })

  test('Edit Resource Links button opens modal with 5 link fields', async ({ page }) => {
    const headerCheckbox = page.locator('thead input[type="checkbox"]')
    await headerCheckbox.check()
    await page.getByRole('button', { name: 'Edit Resource Links' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Resource Links' })).toBeVisible()
    await expect(page.getByText('Applying to')).toBeVisible()
    // The modal subtitle shows "2" inside a <span> within the "Applying to" sentence
    await expect(page.locator('.bg-white .text-gray-700').filter({ hasText: '2' })).toBeVisible()

    // 5 link inputs in the modal
    const linkInputs = page.locator('[placeholder="https://…"]')
    await expect(linkInputs).toHaveCount(5)

    // Link fields disabled by default (checkboxes unchecked)
    const fieldCheckboxes = page.locator('#enable-bookLink1, #enable-bookLink2, #enable-bookLink3, #enable-bookLink4, #enable-bookLink5')
    for (const cb of await fieldCheckboxes.all()) {
      await expect(cb).not.toBeChecked()
    }
  })

  test('modal Cancel button closes modal without saving', async ({ page }) => {
    await page.locator('tbody tr').first().locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Edit Resource Links' }).click()
    await expect(page.getByRole('heading', { name: 'Edit Resource Links' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'Edit Resource Links' })).not.toBeVisible()

    // Selection is preserved after cancel
    await expect(page.getByText('1 entry selected')).toBeVisible()
  })

  test('enabling a link field and saving calls adminApi.update for each selected entry', async ({ page }) => {
    const updateRequests = []
    await page.route('**/api/admin/catalog/**', route => {
      if (route.request().method() === 'PUT') {
        updateRequests.push({ url: route.request().url(), body: route.request().postDataJSON() })
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      } else {
        route.continue()
      }
    })

    // Select both rows via header checkbox
    await page.locator('thead input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Edit Resource Links' }).click()

    // Enable Link 1 and type a URL
    await page.locator('#enable-bookLink1').check()
    await page.locator('[placeholder="https://…"]').first().fill('https://example.com/sheet')

    await page.getByRole('button', { name: /Save to 2 entries/ }).click()

    // Should have fired 2 PUT requests (one per selected entry)
    await expect.poll(() => updateRequests.length, { timeout: 5000 }).toBe(2)

    // Each body should include the updated link
    for (const req of updateRequests) {
      expect(req.body.bookLink1).toBe('https://example.com/sheet')
    }

    // Modal closes and selection clears after save
    await expect(page.getByRole('heading', { name: 'Edit Resource Links' })).not.toBeVisible()
    await expect(page.getByText(/entries selected/)).not.toBeVisible()
  })

  test('trying to save with no fields enabled shows validation error', async ({ page }) => {
    await page.locator('tbody tr').first().locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Edit Resource Links' }).click()

    // Don't enable any field — click Save directly
    await page.getByRole('button', { name: /Save to/ }).click()

    await expect(page.getByText('Enable at least one link field to update.')).toBeVisible()
  })

  test('focusing a link input auto-enables its checkbox', async ({ page }) => {
    await page.locator('tbody tr').first().locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Edit Resource Links' }).click()

    const firstLinkInput = page.locator('[placeholder="https://…"]').first()
    await expect(page.locator('#enable-bookLink1')).not.toBeChecked()

    // Clicking into the input triggers onFocus which auto-enables the checkbox
    await firstLinkInput.click()
    await expect(page.locator('#enable-bookLink1')).toBeChecked()
  })
})

// ── 5. Pricing ─────────────────────────────────────────────────────────────────

test.describe('Pricing', () => {
  test('loads without authentication', async ({ page }) => {
    await page.goto('/pricing')

    await expect(page.getByRole('heading', { name: 'Simple Pricing' })).toBeVisible()
    await expect(page.getByText('7-day free trial')).toBeVisible()
    await expect(page.getByText('No credit card required')).toBeVisible()
  })

  test('accessible via navbar link when logged in', async ({ page }) => {
    await loginAs(page, REGULAR_USER)
    await mockCatalogAPIs(page)
    await page.goto('/catalog')

    await page.getByRole('link', { name: 'Pricing' }).click()
    await expect(page).toHaveURL(/\/pricing/)
    await expect(page.getByRole('heading', { name: 'Simple Pricing' })).toBeVisible()
  })
})
