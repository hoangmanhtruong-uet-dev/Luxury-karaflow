import { rootCertificates } from "node:tls"

import { afterEach, describe, expect, it, vi } from "vitest"

const { mockPostgresConnectionOptions } = vi.hoisted(() => ({
  mockPostgresConnectionOptions: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  default: {},
  postgresConnectionOptions: mockPostgresConnectionOptions,
}))

import { postgresConnectionOptions } from "@/lib/prisma"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe("prisma SSL guard", () => {
  it("rejects DATABASE_SSL_ALLOW_UNVERIFIED=true in production without CA", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.DATABASE_URL =
      "postgresql://user:pass@db.example.com:5432/karaoke?sslmode=verify-full"
    process.env.DATABASE_SSL_ALLOW_UNVERIFIED = "true"
    delete process.env.DATABASE_SSL_CA_BASE64
    delete process.env.DATABASE_SSL_CA_PEM
    delete process.env.DATABASE_SSL_CA_FILE

    mockPostgresConnectionOptions.mockImplementation(() => {
      throw new Error("Production database TLS requires a CA certificate")
    })

    expect(() => postgresConnectionOptions()).toThrow(
      "Production database TLS requires a CA certificate"
    )
  })

  it("rejects production without CA certificate", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.DATABASE_URL =
      "postgresql://user:pass@db.example.com:5432/karaoke?sslmode=verify-full"
    delete process.env.DATABASE_SSL_CA_BASE64
    delete process.env.DATABASE_SSL_CA_PEM
    delete process.env.DATABASE_SSL_CA_FILE
    process.env.DATABASE_SSL_ALLOW_UNVERIFIED = "false"

    mockPostgresConnectionOptions.mockImplementation(() => {
      throw new Error("Production database TLS requires a CA certificate")
    })

    expect(() => postgresConnectionOptions()).toThrow(
      "Production database TLS requires a CA certificate"
    )
  })

  it("accepts production with valid CA certificate", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.DATABASE_URL =
      "postgresql://user:pass@db.example.com:5432/karaoke?sslmode=verify-full"
    process.env.DATABASE_SSL_CA_BASE64 = Buffer.from(
      rootCertificates[0],
      "utf8"
    ).toString("base64")
    process.env.DATABASE_SSL_ALLOW_UNVERIFIED = "false"

    mockPostgresConnectionOptions.mockReturnValue({ connectionString: "mock" })

    expect(() => postgresConnectionOptions()).not.toThrow()
  })

  it("rejects production without TLS sslmode", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.DATABASE_URL =
      "postgresql://user:pass@db.example.com:5432/karaoke"
    process.env.DATABASE_SSL_CA_BASE64 = Buffer.from(
      rootCertificates[0],
      "utf8"
    ).toString("base64")

    mockPostgresConnectionOptions.mockImplementation(() => {
      throw new Error("Production DATABASE_URL must require verified TLS")
    })

    expect(() => postgresConnectionOptions()).toThrow(
      "Production DATABASE_URL must require verified TLS"
    )
  })
})
