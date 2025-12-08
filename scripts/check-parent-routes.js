#!/usr/bin/env node
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:5174'

async function checkRoute(page, path, expectSelector) {
  const url = `${BASE}${path}`
  console.log(`Navigating to ${url}`)
  await page.goto(url, { waitUntil: 'networkidle' })
  try {
    await page.waitForSelector(expectSelector, { timeout: 5000 })
    console.log(`✓ ${path} rendered (found ${expectSelector})`)
    return true
  } catch (err) {
    console.error(`✗ ${path} did not render: ${err.message}`)
    return false
  }
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const checks = [
    { path: '/parent', selector: 'text=Welcome back' },
    { path: '/parent/profile', selector: 'h2:has-text("Profile")' },
    { path: '/parent/payments', selector: 'h2:has-text("Payment Methods & Invoices")' },
  ]

  let allOk = true
  for (const c of checks) {
    const ok = await checkRoute(page, c.path, c.selector)
    allOk = allOk && ok
  }

  await browser.close()
  process.exit(allOk ? 0 : 1)
})().catch((e) => {
  console.error('Script error', e)
  process.exit(2)
})
