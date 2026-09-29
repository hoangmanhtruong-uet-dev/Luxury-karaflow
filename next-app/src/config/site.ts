export type SiteConfig = {
  siteUrl: string
  ogImage: string
  brandName: string
  shortName: string
  description: string
  shortDescription: string
  tagline: string
  hotline: string
  hotlineHref: string
  email: string
  address: string
  zaloUrl: string | null
  messengerUrl: string | null
  facebookUrl: string | null
  branchSummary: string
  openingHours: string
}

const readPublicUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

const PLACEHOLDER_HOTLINES = new Set(["1900 0000", "19000000", "1900 0000 "])
const PLACEHOLDER_BRANDS = new Set(["Royal Karaoke", "Royal"])
const PLACEHOLDER_BRANCH_SUMMARIES = new Set(["4 chi nhánh tại TP. Hồ Chí Minh"])
const PLACEHOLDER_OPENING_HOURS = new Set(["09:00 - 06:00"])

export function validateProductionConfig(
  env: Readonly<Record<string, string | undefined>> = process.env
): void {
  if (env.NODE_ENV !== "production") return

  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!siteUrl || siteUrl.includes("localhost") || !siteUrl.startsWith("https://")) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be a valid HTTPS URL in production"
    )
  }

  const hotline = env.NEXT_PUBLIC_HOTLINE?.trim() ?? ""
  const hotlineDigits = hotline.replace(/\D/g, "")
  if (
    !hotline ||
    PLACEHOLDER_HOTLINES.has(hotline) ||
    !/^\d{9,11}$/.test(hotlineDigits) ||
    hotlineDigits.startsWith("1900")
  ) {
    throw new Error(
      "NEXT_PUBLIC_HOTLINE must be a valid phone number in production (not a placeholder)"
    )
  }

  const brandName = env.NEXT_PUBLIC_BRAND_NAME?.trim()
  if (!brandName || PLACEHOLDER_BRANDS.has(brandName)) {
    throw new Error(
      "NEXT_PUBLIC_BRAND_NAME must be configured in production (not a placeholder)"
    )
  }

  const branchSummary = env.NEXT_PUBLIC_BRANCH_SUMMARY?.trim()
  if (!branchSummary || PLACEHOLDER_BRANCH_SUMMARIES.has(branchSummary)) {
    throw new Error(
      "NEXT_PUBLIC_BRANCH_SUMMARY must be configured in production (not a placeholder)"
    )
  }

  const openingHours = env.NEXT_PUBLIC_OPENING_HOURS?.trim()
  if (!openingHours || PLACEHOLDER_OPENING_HOURS.has(openingHours)) {
    throw new Error(
      "NEXT_PUBLIC_OPENING_HOURS must be configured in production (not a placeholder)"
    )
  }

  const description = env.NEXT_PUBLIC_SITE_DESCRIPTION?.trim()
  if (!description) {
    throw new Error("NEXT_PUBLIC_SITE_DESCRIPTION is required in production")
  }
}

export const siteConfig: SiteConfig = {
  siteUrl: readPublicUrl(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000",
  ogImage: process.env.NEXT_PUBLIC_OG_IMAGE?.trim() || "/images/placeholders/general-placeholder.svg",
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Royal Karaoke",
  shortName: process.env.NEXT_PUBLIC_SHORT_NAME?.trim() || "Royal",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION?.trim() || "Royal Karaoke mang đến không gian giải trí đẳng cấp với phòng hát sang trọng, âm thanh hiện đại và dịch vụ tận tâm cho mọi cuộc vui.",
  shortDescription: process.env.NEXT_PUBLIC_SITE_SHORT_DESCRIPTION?.trim() || "Không gian giải trí sang trọng, âm thanh đỉnh cao và dịch vụ chuẩn VIP.",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE?.trim() || "Luxury sound • Private room • Premium service",
  hotline: process.env.NEXT_PUBLIC_HOTLINE?.trim() || "1900 0000",
  hotlineHref: `tel:${(process.env.NEXT_PUBLIC_HOTLINE?.trim() || "1900 0000").replace(/\D/g, "")}`,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS?.trim() || "",
  zaloUrl: readPublicUrl(process.env.NEXT_PUBLIC_ZALO_URL),
  messengerUrl: readPublicUrl(process.env.NEXT_PUBLIC_MESSENGER_URL),
  facebookUrl: readPublicUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL),
  branchSummary: process.env.NEXT_PUBLIC_BRANCH_SUMMARY?.trim() || "4 chi nhánh tại TP. Hồ Chí Minh",
  openingHours: process.env.NEXT_PUBLIC_OPENING_HOURS?.trim() || "09:00 - 06:00",
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  validateProductionConfig()
}
