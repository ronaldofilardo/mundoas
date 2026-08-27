-- MundoAS / Neon: reconciliação estrutural segura
-- Pré-condições verificadas em 2026-08-27:
--   password_reset_tokens = 0
--   ciclos_pontos = 2
--   procedimentos_pf = 24
--   usuarios = 7
-- Este script não remove tabelas nem dados.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PublicoCicloPontos') THEN
    CREATE TYPE "PublicoCicloPontos" AS ENUM ('PARCEIRO', 'CONSULTOR_PF');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ModalidadeContemplacao') THEN
    CREATE TYPE "ModalidadeContemplacao" AS ENUM ('COMISSAO', 'BONUS_PONTOS');
  END IF;
END $$;

ALTER TYPE "OrigemMovimentacaoPontos" ADD VALUE IF NOT EXISTS 'RESET_ADMINISTRATIVO';

BEGIN;

ALTER TABLE "ciclos_pontos"
  ADD COLUMN IF NOT EXISTS "publico" "PublicoCicloPontos" NOT NULL DEFAULT 'PARCEIRO';
ALTER TABLE "ciclos_pontos" ALTER COLUMN "inicio_resgate_em" SET NOT NULL;

ALTER TABLE "movimentacoes_pontos"
  ADD COLUMN IF NOT EXISTS "consultor_pf_id" UUID;
ALTER TABLE "movimentacoes_pontos" ALTER COLUMN "parceiro_id" DROP NOT NULL;

ALTER TABLE "solicitacoes_resgate"
  ADD COLUMN IF NOT EXISTS "consultor_pf_id" UUID;
ALTER TABLE "solicitacoes_resgate" ALTER COLUMN "parceiro_id" DROP NOT NULL;

ALTER TABLE "procedimentos_pf"
  ADD COLUMN IF NOT EXISTS "modalidade_contemplacao" "ModalidadeContemplacao" NOT NULL DEFAULT 'COMISSAO';

ALTER TABLE "uploads_planilha_backoffice"
  ADD COLUMN IF NOT EXISTS "duplicated_rows" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ranking_snapshots_consultores_pf" (
  "id" UUID NOT NULL,
  "ciclo_pontos_id" UUID NOT NULL,
  "referencia_mes" VARCHAR(7) NOT NULL,
  "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ranking_snapshots_consultores_pf_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ranking_posicoes_consultores_pf" (
  "id" UUID NOT NULL,
  "ranking_snapshot_id" UUID NOT NULL,
  "consultor_pf_id" UUID NOT NULL,
  "posicao" INTEGER NOT NULL,
  "pontos_acumulados" INTEGER NOT NULL,
  CONSTRAINT "ranking_posicoes_consultores_pf_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ranking_snapshots_consultores_pf_ciclo_pontos_id_idx"
  ON "ranking_snapshots_consultores_pf"("ciclo_pontos_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ranking_snapshots_consultores_pf_ciclo_pontos_id_referencia_key"
  ON "ranking_snapshots_consultores_pf"("ciclo_pontos_id", "referencia_mes");
CREATE INDEX IF NOT EXISTS "ranking_posicoes_consultores_pf_ranking_snapshot_id_idx"
  ON "ranking_posicoes_consultores_pf"("ranking_snapshot_id");
CREATE INDEX IF NOT EXISTS "ranking_posicoes_consultores_pf_consultor_pf_id_idx"
  ON "ranking_posicoes_consultores_pf"("consultor_pf_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ranking_posicoes_consultores_pf_ranking_snapshot_id_consult_key"
  ON "ranking_posicoes_consultores_pf"("ranking_snapshot_id", "consultor_pf_id");
CREATE INDEX IF NOT EXISTS "movimentacoes_pontos_consultor_pf_id_idx"
  ON "movimentacoes_pontos"("consultor_pf_id");
CREATE INDEX IF NOT EXISTS "solicitacoes_resgate_consultor_pf_id_idx"
  ON "solicitacoes_resgate"("consultor_pf_id");
CREATE INDEX IF NOT EXISTS "ciclos_pontos_backoffice_id_publico_status_idx"
  ON "ciclos_pontos"("backoffice_id", "publico", "status");

ALTER TABLE "movimentacoes_pontos"
  DROP CONSTRAINT IF EXISTS "movimentacoes_pontos_parceiro_id_fkey";
ALTER TABLE "solicitacoes_resgate"
  DROP CONSTRAINT IF EXISTS "solicitacoes_resgate_parceiro_id_fkey";

ALTER TABLE "movimentacoes_pontos"
  ADD CONSTRAINT "movimentacoes_pontos_parceiro_id_fkey"
  FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "solicitacoes_resgate"
  ADD CONSTRAINT "solicitacoes_resgate_parceiro_id_fkey"
  FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimentacoes_pontos_consultor_pf_id_fkey') THEN
    ALTER TABLE "movimentacoes_pontos" ADD CONSTRAINT "movimentacoes_pontos_consultor_pf_id_fkey"
      FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_resgate_consultor_pf_id_fkey') THEN
    ALTER TABLE "solicitacoes_resgate" ADD CONSTRAINT "solicitacoes_resgate_consultor_pf_id_fkey"
      FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimentacoes_pontos_owner_xor_chk') THEN
    ALTER TABLE "movimentacoes_pontos" ADD CONSTRAINT "movimentacoes_pontos_owner_xor_chk"
      CHECK (("parceiro_id" IS NOT NULL) <> ("consultor_pf_id" IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_resgate_owner_xor_chk') THEN
    ALTER TABLE "solicitacoes_resgate" ADD CONSTRAINT "solicitacoes_resgate_owner_xor_chk"
      CHECK (("parceiro_id" IS NOT NULL) <> ("consultor_pf_id" IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ranking_snapshots_consultores_pf_ciclo_pontos_id_fkey') THEN
    ALTER TABLE "ranking_snapshots_consultores_pf" ADD CONSTRAINT "ranking_snapshots_consultores_pf_ciclo_pontos_id_fkey"
      FOREIGN KEY ("ciclo_pontos_id") REFERENCES "ciclos_pontos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ranking_posicoes_consultores_pf_consultor_pf_id_fkey') THEN
    ALTER TABLE "ranking_posicoes_consultores_pf" ADD CONSTRAINT "ranking_posicoes_consultores_pf_consultor_pf_id_fkey"
      FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ranking_posicoes_consultores_pf_ranking_snapshot_id_fkey') THEN
    ALTER TABLE "ranking_posicoes_consultores_pf" ADD CONSTRAINT "ranking_posicoes_consultores_pf_ranking_snapshot_id_fkey"
      FOREIGN KEY ("ranking_snapshot_id") REFERENCES "ranking_snapshots_consultores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;

-- password_reset_tokens é preservada intencionalmente nesta reconciliação.
