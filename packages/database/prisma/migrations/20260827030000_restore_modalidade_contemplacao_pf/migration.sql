BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ModalidadeContemplacao'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "ModalidadeContemplacao" AS ENUM ('COMISSAO', 'BONUS_PONTOS');
  END IF;
END $$;

ALTER TABLE "procedimentos_pf"
  ADD COLUMN IF NOT EXISTS "modalidade_contemplacao" "ModalidadeContemplacao";

UPDATE "procedimentos_pf"
SET "modalidade_contemplacao" = 'COMISSAO'
WHERE "modalidade_contemplacao" IS NULL;

ALTER TABLE "procedimentos_pf"
  ALTER COLUMN "modalidade_contemplacao" SET DEFAULT 'COMISSAO',
  ALTER COLUMN "modalidade_contemplacao" SET NOT NULL;

COMMIT;
