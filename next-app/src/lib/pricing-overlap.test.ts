import { describe, expect, it } from "vitest"

import { assertNoEqualPriorityOverlap, type PricingRuleInput } from "./pricing-service"

function rule(overrides: Partial<PricingRuleInput> = {}): PricingRuleInput {
  return {
    name: "Test Rule",
    branchId: "branch-01",
    ruleType: "regular",
    startMinute: 0,
    endMinute: 1440,
    hourlyRate: 100000,
    priority: 1,
    validFrom: "2026-01-01",
    ...overrides,
  }
}

describe("assertNoEqualPriorityOverlap", () => {
  it("detects overlap when candidate starts before existing open-ended rule", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-01-01", validTo: null })]
    const candidate = rule({ id: "r2", validFrom: "2026-06-01", validTo: null })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })

  it("detects overlap when candidate ends after existing open-ended rule", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-01-01", validTo: "2026-12-31" })]
    const candidate = rule({ id: "r2", validFrom: "2026-06-01", validTo: null })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })

  it("detects overlap when both are open-ended", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-01-01", validTo: null })]
    const candidate = rule({ id: "r2", validFrom: "2026-06-01", validTo: null })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })

  it("detects overlap when candidate contains existing", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-03-01", validTo: "2026-03-31" })]
    const candidate = rule({ id: "r2", validFrom: "2026-01-01", validTo: "2026-12-31" })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })

  it("detects overlap when existing contains candidate", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-01-01", validTo: "2026-12-31" })]
    const candidate = rule({ id: "r2", validFrom: "2026-03-01", validTo: "2026-03-31" })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })

  it("allows non-overlapping date ranges", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-01-01", validTo: "2026-03-31" })]
    const candidate = rule({ id: "r2", validFrom: "2026-04-01", validTo: "2026-06-30" })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).not.toThrow()
  })

  it("allows non-overlapping time ranges", () => {
    const existing = [rule({ id: "r1", startMinute: 0, endMinute: 720 })]
    const candidate = rule({ id: "r2", startMinute: 720, endMinute: 1440 })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).not.toThrow()
  })

  it("allows different priorities", () => {
    const existing = [rule({ id: "r1", priority: 1 })]
    const candidate = rule({ id: "r2", priority: 2 })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).not.toThrow()
  })

  it("allows different branches", () => {
    const existing = [rule({ id: "r1", branchId: "branch-01" })]
    const candidate = rule({ id: "r2", branchId: "branch-02" })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).not.toThrow()
  })

  it("allows inactive existing rules", () => {
    const existing = [rule({ id: "r1", isActive: false })]
    const candidate = rule({ id: "r2" })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).not.toThrow()
  })

  it("allows same rule id (update)", () => {
    const existing = [rule({ id: "r1" })]
    const candidate = rule({ id: "r1" })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).not.toThrow()
  })

  it("detects overlap when existing is open-ended and candidate starts after", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-01-01", validTo: null })]
    const candidate = rule({ id: "r2", validFrom: "2026-06-01", validTo: "2026-12-31" })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })

  it("detects overlap when candidate is open-ended and starts before existing", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-06-01", validTo: "2026-12-31" })]
    const candidate = rule({ id: "r2", validFrom: "2026-01-01", validTo: null })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })

  it("detects overlap when both open-ended and candidate starts before existing", () => {
    const existing = [rule({ id: "r1", validFrom: "2026-06-01", validTo: null })]
    const candidate = rule({ id: "r2", validFrom: "2026-01-01", validTo: null })

    expect(() => assertNoEqualPriorityOverlap(candidate, existing)).toThrow(
      "overlap"
    )
  })
})
