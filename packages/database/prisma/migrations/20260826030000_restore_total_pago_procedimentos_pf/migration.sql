-- Preserve compatibility with the existing ProcedimentoPF fixtures and
-- historical schema contract while valor_total remains the canonical upload
-- field for the current production flow.

ALTER TABLE "procedimentos_pf"
  ADD COLUMN IF NOT EXISTS "total_pago" DECIMAL(10,2);

ALTER TABLE "procedimentos_pf"
  ALTER COLUMN "total_pago" SET DEFAULT 0;

UPDATE "procedimentos_pf"
SET "total_pago" = 0
WHERE "total_pago" IS NULL;

ALTER TABLE "procedimentos_pf"
  ALTER COLUMN "total_pago" SET NOT NULL;
