import { cache } from "react"

import prisma from "@/lib/prisma"

export type CatalogBranch = {
  id: string
  name: string
  slug: string
  address: string
  district: string
  city: string
  phone: string
  email: string | null
  openingHours: { open: string; close: string }
  amenities: string[]
  status: string
  imageUrl: string | null
}

export type CatalogRoom = {
  id: string
  branchId: string
  name: string
  slug: string
  tier: string
  capacity: { min: number; max: number }
  hourlyRate: number
  features: string[]
  status: string
  imageUrl: string | null
}

export type CatalogMenuItem = {
  id: string
  name: string
  slug: string
  category: string
  description: string
  price: number
  imageUrl: string | null
  isSignature: boolean
  isAvailable: boolean
}

export const getCatalogBranches = cache(async (): Promise<CatalogBranch[]> => {
  const branches = await prisma.branch.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
  })
  return branches.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    address: b.address,
    district: b.district,
    city: b.city,
    phone: b.phone,
    email: b.email,
    openingHours: b.openingHours as { open: string; close: string },
    amenities: b.amenities as string[],
    status: b.status,
    imageUrl: b.imageUrl,
  }))
})

export const getCatalogRooms = cache(async (): Promise<CatalogRoom[]> => {
  const rooms = await prisma.room.findMany({
    where: { status: "available" },
    orderBy: { createdAt: "asc" },
  })
  return rooms.map((r) => ({
    id: r.id,
    branchId: r.branchId,
    name: r.name,
    slug: r.slug,
    tier: r.tier,
    capacity: r.capacity as { min: number; max: number },
    hourlyRate: r.hourlyRate,
    features: r.features as string[],
    status: r.status,
    imageUrl: r.imageUrl,
  }))
})

export const getCatalogMenuItems = cache(async (): Promise<CatalogMenuItem[]> => {
  const items = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: "asc" },
  })
  return items.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    category: m.category,
    description: m.description,
    price: m.price,
    imageUrl: m.imageUrl,
    isSignature: m.isSignature,
    isAvailable: m.isAvailable,
  }))
})

export const getCatalogBranchBySlug = cache(
  async (slug: string): Promise<CatalogBranch | null> => {
    const branch = await prisma.branch.findUnique({
      where: { slug, status: "active" },
    })
    if (!branch) return null
    return {
      id: branch.id,
      name: branch.name,
      slug: branch.slug,
      address: branch.address,
      district: branch.district,
      city: branch.city,
      phone: branch.phone,
      email: branch.email,
      openingHours: branch.openingHours as { open: string; close: string },
      amenities: branch.amenities as string[],
      status: branch.status,
      imageUrl: branch.imageUrl,
    }
  }
)
