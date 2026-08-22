-- Fix uploads_planilha_pf to match Prisma schema (uploads_planilha_backoffice)
-- Table is empty, safe to alter

BEGIN;

-- 1. Add backoffice_id column
ALTER TABLE "uploads_planilha_pf" ADD COLUMN "backoffice_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 2. Create index
CREATE INDEX IF NOT EXISTS "uploads_planilha_backoffice_backoffice_id_idx" ON "uploads_planilha_pf"("backoffice_id");

-- 3. Rename table
ALTER TABLE "uploads_planilha_pf" RENAME TO "uploads_planilha_backoffice";

-- 4. Rename primary key constraint
ALTER TABLE "uploads_planilha_backoffice" RENAME CONSTRAINT "uploads_planilha_pf_pkey" TO "uploads_planilha_backoffice_pkey";

-- 5. Rename index
ALTER INDEX IF EXISTS "uploads_planilha_pf_mes_referencia_idx" RENAME TO "uploads_planilha_backoffice_mes_referencia_idx";

-- 6. Update foreign key from procedimentos_pf
ALTER TABLE "procedimentos_pf" DROP CONSTRAINT IF EXISTS "procedimentos_pf_upload_id_fkey";
ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_upload_id_fkey" 
  FOREIGN KEY ("upload_id") REFERENCES "uploads_planilha_backoffice"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

COMMIT;
