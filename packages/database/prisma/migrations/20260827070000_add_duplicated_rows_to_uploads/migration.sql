ALTER TABLE "uploads_planilha_backoffice"
  ADD COLUMN IF NOT EXISTS "duplicated_rows" INTEGER NOT NULL DEFAULT 0;
