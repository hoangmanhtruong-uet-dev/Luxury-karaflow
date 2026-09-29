import { describe, expect, it } from "vitest"

import { resolvePaymentWebhookTransition } from "./payment-provider"

describe("payment webhook state machine", () => {
  it("allows pending -> completed (paid)", () => {
    const result = resolvePaymentWebhookTransition("pending", "paid")
    expect(result).toEqual({ status: "completed", replayed: false })
  })

  it("allows pending -> failed", () => {
    const result = resolvePaymentWebhookTransition("pending", "failed")
    expect(result).toEqual({ status: "failed", replayed: false })
  })

  it("allows pending -> expired", () => {
    const result = resolvePaymentWebhookTransition("pending", "expired")
    expect(result).toEqual({ status: "expired", replayed: false })
  })

  it("rejects completed -> failed (late event)", () => {
    expect(() => resolvePaymentWebhookTransition("completed", "failed")).toThrow(
      "INVALID_PAYMENT_TRANSITION"
    )
  })

  it("rejects completed -> expired (late event)", () => {
    expect(() => resolvePaymentWebhookTransition("completed", "expired")).toThrow(
      "INVALID_PAYMENT_TRANSITION"
    )
  })

  it("allows completed -> refunded", () => {
    const result = resolvePaymentWebhookTransition("completed", "refunded")
    expect(result).toEqual({ status: "refunded", replayed: false })
  })

  it("rejects refunded -> paid", () => {
    expect(() => resolvePaymentWebhookTransition("refunded", "paid")).toThrow(
      "INVALID_PAYMENT_TRANSITION"
    )
  })

  it("rejects refunded -> failed", () => {
    expect(() => resolvePaymentWebhookTransition("refunded", "failed")).toThrow(
      "INVALID_PAYMENT_TRANSITION"
    )
  })

  it("rejects failed -> paid", () => {
    expect(() => resolvePaymentWebhookTransition("failed", "paid")).toThrow(
      "INVALID_PAYMENT_TRANSITION"
    )
  })

  it("rejects expired -> paid", () => {
    expect(() => resolvePaymentWebhookTransition("expired", "paid")).toThrow(
      "INVALID_PAYMENT_TRANSITION"
    )
  })

  it("detects replay of same status", () => {
    const result = resolvePaymentWebhookTransition("completed", "paid")
    expect(result.replayed).toBe(true)
  })

  it("detects replay of failed", () => {
    const result = resolvePaymentWebhookTransition("failed", "failed")
    expect(result.replayed).toBe(true)
  })
})
