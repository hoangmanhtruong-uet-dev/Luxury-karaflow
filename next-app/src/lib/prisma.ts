import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

import { loadDatabaseCertificateAuthority } from "@/lib/database-ssl"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const globalForPool = globalThis as unknown as {
  pgPool: Pool | undefined
}

function integerSetting(name: string, fallback: number, maximum: number) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}`)
  }
  return value
}

function postgresConnectionOptions() {
  const configuredUrl =
    process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL
  if (!configuredUrl) return undefined

  const url = new URL(configuredUrl)
  const sslMode = url.searchParams.get("sslmode")
  const requiresTls = ["require", "verify-ca", "verify-full"].includes(
    sslMode ?? ""
  )

  if (process.env.NODE_ENV === "production" && !requiresTls) {
    throw new Error("Production DATABASE_URL must require verified TLS")
  }

  if (!requiresTls) return { connectionString: url.toString() }

  url.searchParams.delete("sslmode")
  const ca = loadDatabaseCertificateAuthority()
  const isProductionBuild =
    process.env.NEXT_PHASE === "phase-production-build"
  const allowUnverified =
    process.env.DATABASE_SSL_ALLOW_UNVERIFIED === "true"

  if (
    process.env.NODE_ENV === "production" &&
    !isProductionBuild &&
    !ca &&
    !allowUnverified
  ) {
    throw new Error("Production database TLS requires a CA certificate")
  }

  return {
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: !allowUnverified,
      ...(ca ? { ca } : {}),
    },
  }
}

function createPool(): Pool | undefined {
  const connectionOptions = postgresConnectionOptions()
  if (!connectionOptions) return undefined
  return new Pool({
    ...connectionOptions,
    max: integerSetting("DATABASE_POOL_MAX", 5, 50),
    connectionTimeoutMillis: integerSetting(
      "DATABASE_CONNECT_TIMEOUT_MS",
      3_000,
      60_000
    ),
    idleTimeoutMillis: integerSetting(
      "DATABASE_IDLE_TIMEOUT_MS",
      30_000,
      600_000
    ),
    query_timeout: integerSetting("DATABASE_QUERY_TIMEOUT_MS", 10_000, 120_000),
    statement_timeout: integerSetting(
      "DATABASE_STATEMENT_TIMEOUT_MS",
      10_000,
      120_000
    ),
    maxLifetimeSeconds: integerSetting(
      "DATABASE_CONNECTION_LIFETIME_SECONDS",
      300,
      3_600
    ),
    application_name: "web-karaoke",
  })
}

let _pool: Pool | undefined | null = null
function getPool(): Pool {
  if (_pool !== null) return _pool!
  const pool = globalForPool.pgPool ?? createPool()
  if (!pool) {
    throw new Error(
      "DATABASE_URL is not configured. Database operations are unavailable."
    )
  }
  _pool = pool
  if (process.env.NODE_ENV !== "production") {
    globalForPool.pgPool = pool
  }
  return pool
}

function createPrismaClient(): PrismaClient {
  const pool = getPool()
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: integerSetting(
        "DATABASE_TRANSACTION_MAX_WAIT_MS",
        3_000,
        60_000
      ),
      timeout: integerSetting(
        "DATABASE_TRANSACTION_TIMEOUT_MS",
        10_000,
        120_000
      ),
    },
  })
}

let _prisma: PrismaClient | undefined | null = null
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (_prisma === null) {
      _prisma = globalForPrisma.prisma ?? createPrismaClient()
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = _prisma
      }
    }
    return Reflect.get(_prisma!, prop)
  },
})

export default prisma
