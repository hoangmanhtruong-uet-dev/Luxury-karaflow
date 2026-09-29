import { describe, expect, it } from "vitest"

import { validateProductionConfig } from "./site"

function productionEnv(overrides: Record<string, string> = {}) {
  return {
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://karaoke.example.com",
    NEXT_PUBLIC_HOTLINE: "0901234567",
    NEXT_PUBLIC_BRAND_NAME: "My Karaoke Brand",
    NEXT_PUBLIC_BRANCH_SUMMARY: "3 chi nhánh tại Hà Nội",
    NEXT_PUBLIC_OPENING_HOURS: "10:00 - 23:00",
    NEXT_PUBLIC_SITE_DESCRIPTION: "Karaoke cao cấp",
    ...overrides,
  }
}

describe("validateProductionConfig", () => {
  it("passes when all required production values are set", () => {
    expect(() => validateProductionConfig(productionEnv())).not.toThrow()
  })

  it("does nothing when NODE_ENV is not production", () => {
    expect(() =>
      validateProductionConfig({ NODE_ENV: "development" })
    ).not.toThrow()
  })

  it("throws when site URL is missing", () => {
    const env = productionEnv({ NEXT_PUBLIC_SITE_URL: "" })
    expect(() => validateProductionConfig(env)).toThrow("NEXT_PUBLIC_SITE_URL")
  })

  it("throws when site URL is localhost", () => {
    expect(() =>
      validateProductionConfig(
        productionEnv({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" })
      )
    ).toThrow("HTTPS")
  })

  it("throws when site URL is not HTTPS", () => {
    expect(() =>
      validateProductionConfig(
        productionEnv({ NEXT_PUBLIC_SITE_URL: "http://karaoke.example.com" })
      )
    ).toThrow("HTTPS")
  })

  it("throws when hotline is missing", () => {
    const env = productionEnv({ NEXT_PUBLIC_HOTLINE: "" })
    expect(() => validateProductionConfig(env)).toThrow("NEXT_PUBLIC_HOTLINE")
  })

  it("throws when hotline is placeholder", () => {
    expect(() =>
      validateProductionConfig(
        productionEnv({ NEXT_PUBLIC_HOTLINE: "1900 0000" })
      )
    ).toThrow("placeholder")
  })

  it("throws when brand name is default", () => {
    expect(() =>
      validateProductionConfig(
        productionEnv({ NEXT_PUBLIC_BRAND_NAME: "Royal Karaoke" })
      )
    ).toThrow("BRAND_NAME")
  })

  it("throws when branch summary is default", () => {
    expect(() =>
      validateProductionConfig(
        productionEnv({ NEXT_PUBLIC_BRANCH_SUMMARY: "4 chi nhánh tại TP. Hồ Chí Minh" })
      )
    ).toThrow("BRANCH_SUMMARY")
  })

  it("throws when opening hours is default", () => {
    expect(() =>
      validateProductionConfig(
        productionEnv({ NEXT_PUBLIC_OPENING_HOURS: "09:00 - 06:00" })
      )
    ).toThrow("OPENING_HOURS")
  })

  it("throws when description is missing", () => {
    const env = productionEnv({ NEXT_PUBLIC_SITE_DESCRIPTION: "" })
    expect(() => validateProductionConfig(env)).toThrow("SITE_DESCRIPTION")
  })
})
