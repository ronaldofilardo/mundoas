-- Ensure uploads_planilha_backoffice uses snake_case nome_arquivo
-- Production DB already has nome_arquivo; local DB has legacy nomeArquivo.
-- This migration idempotently aligns to the production schema.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'uploads_planilha_backoffice'
      AND column_name = 'nomeArquivo'
  ) THEN
    ALTER TABLE "uploads_planilha_backoffice" RENAME COLUMN "nomeArquivo" TO "nome_arquivo";
  END IF;
END $$;

COMMIT;
