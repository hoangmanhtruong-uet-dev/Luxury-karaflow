import { describe, expect, it, vi } from "vitest"

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    branch: { findMany: vi.fn(), findUnique: vi.fn() },
    room: { findMany: vi.fn() },
    menuItem: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}))

import {
  getCatalogBranches,
  getCatalogRooms,
  getCatalogMenuItems,
  getCatalogBranchBySlug,
} from "./catalog-service"

describe("catalog-service", () => {
  it("getCatalogBranches returns active branches mapped to catalog shape", async () => {
    mockPrisma.branch.findMany.mockResolvedValue([
      {
        id: "b1",
        name: "Branch 1",
        slug: "branch-1",
        address: "123 St",
        district: "Q1",
        city: "HCM",
        phone: "0901234567",
        email: "b1@test.com",
        openingHours: { open: "09:00", close: "06:00" },
        amenities: ["Wifi"],
        status: "active",
        imageUrl: "/images/b1.jpg",
        createdAt: new Date(),
      },
    ])

    const result = await getCatalogBranches()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: "b1",
      name: "Branch 1",
      slug: "branch-1",
      status: "active",
    })
  })

  it("getCatalogRooms returns available rooms", async () => {
    mockPrisma.room.findMany.mockResolvedValue([
      {
        id: "r1",
        branchId: "b1",
        name: "Room 1",
        slug: "room-1",
        tier: "vip",
        capacity: { min: 2, max: 10 },
        hourlyRate: 500000,
        features: ["AC"],
        status: "available",
        imageUrl: "/images/r1.jpg",
        createdAt: new Date(),
      },
    ])

    const result = await getCatalogRooms()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: "r1", tier: "vip" })
  })

  it("getCatalogMenuItems returns available items", async () => {
    mockPrisma.menuItem.findMany.mockResolvedValue([
      {
        id: "m1",
        name: "Item 1",
        slug: "item-1",
        category: "drink",
        description: "Desc",
        price: 50000,
        imageUrl: "/images/m1.jpg",
        isSignature: false,
        isAvailable: true,
        createdAt: new Date(),
      },
    ])

    const result = await getCatalogMenuItems()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: "m1", category: "drink" })
  })

  it("getCatalogBranchBySlug returns branch when found", async () => {
    mockPrisma.branch.findUnique.mockResolvedValue({
      id: "b1",
      name: "Branch 1",
      slug: "branch-1",
      address: "123 St",
      district: "Q1",
      city: "HCM",
      phone: "0901234567",
      email: null,
      openingHours: { open: "09:00", close: "06:00" },
      amenities: [],
      status: "active",
      imageUrl: null,
    })

    const result = await getCatalogBranchBySlug("branch-1")
    expect(result).toMatchObject({ slug: "branch-1" })
  })

  it("getCatalogBranchBySlug returns null when not found", async () => {
    mockPrisma.branch.findUnique.mockResolvedValue(null)
    const result = await getCatalogBranchBySlug("nonexistent")
    expect(result).toBeNull()
  })
})
