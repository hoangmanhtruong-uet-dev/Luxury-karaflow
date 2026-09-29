import { test, expect } from "@playwright/test"

test.describe("Critical Path: Catalog → Booking", () => {
  test("can view rooms catalog", async ({ page }) => {
    await page.goto("/rooms")
    await expect(page).toHaveTitle(/Phòng hát/i)
  })

  test("can view branches catalog", async ({ page }) => {
    await page.goto("/branches")
    await expect(page).toHaveTitle(/Chi nhánh/i)
  })

  test("can view menu", async ({ page }) => {
    await page.goto("/menu")
    await expect(page).toHaveTitle(/Menu/i)
  })

  test("can view promotions", async ({ page }) => {
    await page.goto("/promotions")
    await expect(page).toHaveTitle(/Ưu đãi/i)
  })

  test("can navigate to booking page", async ({ page }) => {
    await page.goto("/booking")
    await expect(page).toHaveTitle(/Đặt phòng/i)
  })

  test("booking page has form elements", async ({ page }) => {
    await page.goto("/booking")
    const form = page.locator("form").first()
    await expect(form).toBeVisible()
  })
})

test.describe("Accessibility Smoke", () => {
  test("homepage has no horizontal scroll at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })

  test("homepage has no horizontal scroll at 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/")
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(768)
  })

  test("all images have alt text", async ({ page }) => {
    await page.goto("/")
    const images = page.locator("img")
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt")
      expect(alt).toBeTruthy()
    }
  })
})
