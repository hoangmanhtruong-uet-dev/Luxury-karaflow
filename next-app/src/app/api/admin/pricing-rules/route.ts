import { z } from "zod"
import prisma from "@/lib/prisma"
import { apiError, apiSuccess } from "@/lib/api-response"
import { authorizeAdminApi, hasPrincipal } from "@/lib/admin-api"
import { assertNoEqualPriorityOverlap } from "@/lib/pricing-service"
import { readJsonBodyResult, requireSameOrigin } from "@/lib/request-security"

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  branchId: z.string().min(1),
  roomId: z.string().nullable().optional(),
  roomTier: z.enum(["standard", "vip", "premium", "presidential"]).nullable().optional(),
  ruleType: z.enum(["holiday", "special", "weekend", "regular", "defaultRoom"]),
  specificDate: z.string().nullable().optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  hourlyRate: z.number().int().min(0),
  priority: z.number().int().min(0),
  validFrom: z.string(),
  validTo: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: Request) {
  const a = await authorizeAdminApi("pricing.manage")
  if (!hasPrincipal(a)) return a.response
  const branchId = new URL(request.url).searchParams.get("branchId") ?? a.principal.assignedBranchId ?? undefined
  return apiSuccess(await prisma.pricingRule.findMany({ where: { branchId }, orderBy: [{ priority: "desc" }, { createdAt: "desc" }] }))
}

export async function POST(request: Request) {
  const origin = requireSameOrigin(request)
  if (origin) return origin
  const a = await authorizeAdminApi("pricing.manage")
  if (!hasPrincipal(a)) return a.response
  const body = await readJsonBodyResult(request)
  if ("response" in body) return body.response
  const p = schema.safeParse(body.data)
  if (!p.success) return apiError(422, "VALIDATION_ERROR", "Invalid pricing rule.", p.error.flatten().fieldErrors)
  if (a.principal.assignedBranchId && a.principal.assignedBranchId !== p.data.branchId)
    return apiError(403, "BRANCH_SCOPE", "Branch not permitted.")

  try {
    const created = await prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findUnique({ where: { id: p.data.branchId }, select: { id: true } })
      if (!branch) throw Object.assign(new Error("Branch not found"), { code: "BRANCH_NOT_FOUND", status: 422 })

      if (p.data.roomId) {
        const room = await tx.room.findFirst({ where: { id: p.data.roomId, branchId: p.data.branchId }, select: { id: true } })
        if (!room) throw Object.assign(new Error("Room not found in branch"), { code: "ROOM_NOT_FOUND", status: 422 })
      }

      const existing = await tx.pricingRule.findMany({
        where: { branchId: p.data.branchId, isActive: true },
        select: { id: true, roomId: true, roomTier: true, specificDate: true, dayOfWeek: true, startMinute: true, endMinute: true, priority: true, validFrom: true, validTo: true, isActive: true },
      })

      assertNoEqualPriorityOverlap(
        p.data,
        existing.map((r) => ({
          name: r.id,
          branchId: p.data.branchId,
          roomId: r.roomId,
          roomTier: r.roomTier,
          ruleType: p.data.ruleType,
          specificDate: r.specificDate?.toISOString().slice(0, 10) ?? null,
          dayOfWeek: null,
          startMinute: r.startMinute,
          endMinute: r.endMinute,
          hourlyRate: 0,
          priority: r.priority,
          validFrom: r.validFrom.toISOString().slice(0, 10),
          validTo: r.validTo?.toISOString().slice(0, 10) ?? null,
          isActive: r.isActive,
        }))
      )

      const rule = await tx.pricingRule.create({
        data: {
          ...p.data,
          specificDate: p.data.specificDate ? new Date(p.data.specificDate) : null,
          validFrom: new Date(p.data.validFrom),
          validTo: p.data.validTo ? new Date(p.data.validTo) : null,
        },
      })
      await tx.auditLog.create({
        data: { actorId: a.principal.id, actorRole: a.principal.role, action: "pricing-rule.created", entityType: "pricingRule", entityId: rule.id, newValue: rule },
      })
      return rule
    }, { isolationLevel: "Serializable" })

    return apiSuccess(created, 201)
  } catch (e: unknown) {
    if (e instanceof Error) {
      if ("code" in e && (e as { code: string }).code === "BRANCH_NOT_FOUND")
        return apiError(422, "BRANCH_NOT_FOUND", "Branch not found.")
      if ("code" in e && (e as { code: string }).code === "ROOM_NOT_FOUND")
        return apiError(422, "ROOM_NOT_FOUND", "Room not found in branch.")
      if (e.message === "Equal-priority pricing rules overlap")
        return apiError(409, "PRICING_OVERLAP", e.message)
      if ("code" in e && (e as { code: string }).code === "P2034")
        return apiError(409, "PRICING_OVERLAP", "Concurrent pricing rule creation conflict.")
    }
    return apiError(500, "PRICING_RULE_FAILED", "Failed to create pricing rule.")
  }
}
