-- Reconcile rule item models with the physical schema.
-- Safe for a fresh test database and idempotent for environments where a table
-- was already created manually during the previous reconstruction.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RegraItemTipo') THEN
    CREATE TYPE "RegraItemTipo" AS ENUM ('SISTEMA', 'CUSTOM');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "regras_comerciais_itens" (
  "id" UUID NOT NULL,
  "regra_comercial_id" UUID NOT NULL,
  "nome" VARCHAR(100) NOT NULL,
  "percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "tipo" "RegraItemTipo" NOT NULL DEFAULT 'CUSTOM',
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "regras_comerciais_itens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "regras_gestores_itens" (
  "id" UUID NOT NULL,
  "regra_gestor_id" UUID NOT NULL,
  "nome" VARCHAR(100) NOT NULL,
  "percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "tipo" "RegraItemTipo" NOT NULL DEFAULT 'CUSTOM',
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "regras_gestores_itens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "regras_faltas_itens" (
  "id" UUID NOT NULL,
  "regra_falta_id" UUID NOT NULL,
  "nome" VARCHAR(100) NOT NULL,
  "percentual" DECIMAL(9,4) NOT NULL DEFAULT 0,
  "tipo" "RegraItemTipo" NOT NULL DEFAULT 'CUSTOM',
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "regras_faltas_itens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "regras_comerciais_itens_regra_comercial_id_idx"
  ON "regras_comerciais_itens"("regra_comercial_id");
CREATE INDEX IF NOT EXISTS "regras_gestores_itens_regra_gestor_id_idx"
  ON "regras_gestores_itens"("regra_gestor_id");
CREATE INDEX IF NOT EXISTS "regras_faltas_itens_regra_falta_id_idx"
  ON "regras_faltas_itens"("regra_falta_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regras_comerciais_itens_regra_comercial_id_fkey') THEN
    ALTER TABLE "regras_comerciais_itens"
      ADD CONSTRAINT "regras_comerciais_itens_regra_comercial_id_fkey"
      FOREIGN KEY ("regra_comercial_id") REFERENCES "regras_comerciais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regras_gestores_itens_regra_gestor_id_fkey') THEN
    ALTER TABLE "regras_gestores_itens"
      ADD CONSTRAINT "regras_gestores_itens_regra_gestor_id_fkey"
      FOREIGN KEY ("regra_gestor_id") REFERENCES "regras_gestores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regras_faltas_itens_regra_falta_id_fkey') THEN
    ALTER TABLE "regras_faltas_itens"
      ADD CONSTRAINT "regras_faltas_itens_regra_falta_id_fkey"
      FOREIGN KEY ("regra_falta_id") REFERENCES "regras_faltas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
