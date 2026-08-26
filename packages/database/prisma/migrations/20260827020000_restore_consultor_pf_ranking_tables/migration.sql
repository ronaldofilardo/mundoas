BEGIN;

CREATE TABLE IF NOT EXISTS "ranking_snapshots_consultores_pf" (
  "id" UUID NOT NULL,
  "ciclo_pontos_id" UUID NOT NULL,
  "referencia_mes" VARCHAR(7) NOT NULL,
  "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ranking_snapshots_consultores_pf_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ranking_snapshots_consultores_pf_ciclo_pontos_id_fkey'
  ) THEN
    ALTER TABLE "ranking_snapshots_consultores_pf"
      ADD CONSTRAINT "ranking_snapshots_consultores_pf_ciclo_pontos_id_fkey"
      FOREIGN KEY ("ciclo_pontos_id") REFERENCES "ciclos_pontos"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "ranking_snapshots_consultores_pf_ciclo_pontos_id_referencia_mes_key"
  ON "ranking_snapshots_consultores_pf" ("ciclo_pontos_id", "referencia_mes");
CREATE INDEX IF NOT EXISTS "ranking_snapshots_consultores_pf_ciclo_pontos_id_idx"
  ON "ranking_snapshots_consultores_pf" ("ciclo_pontos_id");

CREATE TABLE IF NOT EXISTS "ranking_posicoes_consultores_pf" (
  "id" UUID NOT NULL,
  "ranking_snapshot_id" UUID NOT NULL,
  "consultor_pf_id" UUID NOT NULL,
  "posicao" INTEGER NOT NULL,
  "pontos_acumulados" INTEGER NOT NULL,
  CONSTRAINT "ranking_posicoes_consultores_pf_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ranking_posicoes_consultores_pf_ranking_snapshot_id_fkey'
  ) THEN
    ALTER TABLE "ranking_posicoes_consultores_pf"
      ADD CONSTRAINT "ranking_posicoes_consultores_pf_ranking_snapshot_id_fkey"
      FOREIGN KEY ("ranking_snapshot_id") REFERENCES "ranking_snapshots_consultores_pf"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ranking_posicoes_consultores_pf_consultor_pf_id_fkey'
  ) THEN
    ALTER TABLE "ranking_posicoes_consultores_pf"
      ADD CONSTRAINT "ranking_posicoes_consultores_pf_consultor_pf_id_fkey"
      FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "ranking_posicoes_consultores_pf_snapshot_consultor_key"
  ON "ranking_posicoes_consultores_pf" ("ranking_snapshot_id", "consultor_pf_id");
CREATE INDEX IF NOT EXISTS "ranking_posicoes_consultores_pf_snapshot_idx"
  ON "ranking_posicoes_consultores_pf" ("ranking_snapshot_id");
CREATE INDEX IF NOT EXISTS "ranking_posicoes_consultores_pf_consultor_idx"
  ON "ranking_posicoes_consultores_pf" ("consultor_pf_id");

COMMIT;
