-- Add payment event ledger for idempotent webhook processing
-- Unique constraint on (provider, eventId) prevents duplicate processing

CREATE TABLE IF NOT EXISTS "PaymentEventLedger" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "providerPaymentId" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEventLedger_provider_eventId_key" UNIQUE ("provider", "eventId")
);

CREATE INDEX IF NOT EXISTS "PaymentEventLedger_paymentId_idx" ON "PaymentEventLedger"("paymentId");
