BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PublicoCicloPontos'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "PublicoCicloPontos" AS ENUM ('PARCEIRO', 'CONSULTOR_PF');
  END IF;
END $$;

ALTER TABLE "ciclos_pontos"
  ADD COLUMN IF NOT EXISTS "publico" "PublicoCicloPontos";

UPDATE "ciclos_pontos"
SET "publico" = 'PARCEIRO'
WHERE "publico" IS NULL;

ALTER TABLE "ciclos_pontos"
  ALTER COLUMN "publico" SET DEFAULT 'PARCEIRO',
  ALTER COLUMN "publico" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "ciclos_pontos_backoffice_id_publico_status_idx"
  ON "ciclos_pontos" ("backoffice_id", "publico", "status");

COMMIT;
