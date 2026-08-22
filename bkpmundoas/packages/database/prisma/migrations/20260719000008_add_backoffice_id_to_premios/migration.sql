-- Add backoffice_id to premios table
-- Table appears to be empty or shared across backoffices

BEGIN;

ALTER TABLE "premios" ADD COLUMN IF NOT EXISTS "backoffice_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

CREATE INDEX IF NOT EXISTS "premios_backoffice_id_idx" ON "premios"("backoffice_id");

COMMIT;
