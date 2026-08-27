BEGIN;

ALTER TABLE "movimentacoes_pontos"
  ADD COLUMN IF NOT EXISTS "consultor_pf_id" UUID;

ALTER TABLE "solicitacoes_resgate"
  ADD COLUMN IF NOT EXISTS "consultor_pf_id" UUID;

ALTER TABLE "movimentacoes_pontos"
  ALTER COLUMN "parceiro_id" DROP NOT NULL;

ALTER TABLE "solicitacoes_resgate"
  ALTER COLUMN "parceiro_id" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movimentacoes_pontos_consultor_pf_id_fkey'
  ) THEN
    ALTER TABLE "movimentacoes_pontos"
      ADD CONSTRAINT "movimentacoes_pontos_consultor_pf_id_fkey"
      FOREIGN KEY ("consultor_pf_id")
      REFERENCES "consultores_pf"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'solicitacoes_resgate_consultor_pf_id_fkey'
  ) THEN
    ALTER TABLE "solicitacoes_resgate"
      ADD CONSTRAINT "solicitacoes_resgate_consultor_pf_id_fkey"
      FOREIGN KEY ("consultor_pf_id")
      REFERENCES "consultores_pf"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movimentacoes_pontos_owner_xor_chk'
  ) THEN
    ALTER TABLE "movimentacoes_pontos"
      ADD CONSTRAINT "movimentacoes_pontos_owner_xor_chk"
      CHECK (("parceiro_id" IS NOT NULL) <> ("consultor_pf_id" IS NOT NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'solicitacoes_resgate_owner_xor_chk'
  ) THEN
    ALTER TABLE "solicitacoes_resgate"
      ADD CONSTRAINT "solicitacoes_resgate_owner_xor_chk"
      CHECK (("parceiro_id" IS NOT NULL) <> ("consultor_pf_id" IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "movimentacoes_pontos_consultor_pf_id_idx"
  ON "movimentacoes_pontos"("consultor_pf_id");

CREATE INDEX IF NOT EXISTS "solicitacoes_resgate_consultor_pf_id_idx"
  ON "solicitacoes_resgate"("consultor_pf_id");

COMMIT;
