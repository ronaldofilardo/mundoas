-- Align ProcedimentoPF with the Prisma contract used by production uploads
-- and points distribution. Existing rows remain valid with the zero default.

ALTER TABLE "procedimentos_pf"
  ADD COLUMN IF NOT EXISTS "valor_total" DECIMAL(10,2) DEFAULT 0;

UPDATE "procedimentos_pf"
SET "valor_total" = 0
WHERE "valor_total" IS NULL;
