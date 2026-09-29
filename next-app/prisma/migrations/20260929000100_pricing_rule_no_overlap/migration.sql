-- Add exclusion constraint to prevent equal-priority pricing rule overlaps
-- Uses btree_gist extension for scalar comparisons in exclusion constraints

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop existing constraint if exists (idempotent)
ALTER TABLE "PricingRule" DROP CONSTRAINT IF EXISTS "PricingRule_no_equal_priority_overlap";

-- Add exclusion constraint: no two active rules with same branch, priority, and overlapping date/time ranges
-- Note: This is a simplified constraint. Full room/branch scoping is enforced at application level.
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_no_equal_priority_overlap"
  EXCLUDE USING gist (
    "branchId" WITH =,
    "priority" WITH =,
    daterange("validFrom", COALESCE("validTo", '9999-12-31'::date), '[)') WITH &&
  )
  WHERE ("isActive" = true);
