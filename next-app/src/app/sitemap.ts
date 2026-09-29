import type { MetadataRoute } from "next"
import { getCatalogBranches } from "@/lib/catalog-service"
import { siteConfig } from "@/config/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  let branches: Awaited<ReturnType<typeof getCatalogBranches>> = []
  try {
    branches = await getCatalogBranches()
  } catch {
    // DB not available during build; sitemap will be generated at runtime
  }

  return [
    { url: siteConfig.siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...["rooms", "gallery", "menu", "branches", "promotions", "contact", "booking"].map(
      (path) => ({
        url: `${siteConfig.siteUrl}/${path}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: path === "booking" ? 0.8 : 0.7,
      })
    ),
    ...branches.map((branch) => ({
      url: `${siteConfig.siteUrl}/branches/${branch.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
