-- Unificação das tabelas `comerciais` e `liderancas` em `equipe`.
-- Dados são ficcionais; migração preserva todos os registros existentes.

-- 1) Criar enum TipoEquipe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoEquipe') THEN
    CREATE TYPE "TipoEquipe" AS ENUM ('COMERCIAL', 'LIDERANCA');
  END IF;
END$$;

-- 2) Criar tabela `equipe`
CREATE TABLE IF NOT EXISTS "equipe" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "backoffice_id" UUID,
    "tipo" "TipoEquipe" NOT NULL,
    "tipo_lideranca" "TipoLideranca",
    "funcao" "FuncaoComercial",
    "percentual_comissao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "lideranca_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipe_pkey" PRIMARY KEY ("id")
);

-- Índices e uniques (idempotentes)
CREATE UNIQUE INDEX IF NOT EXISTS "equipe_usuario_id_key" ON "equipe"("usuario_id");
CREATE UNIQUE INDEX IF NOT EXISTS "equipe_cpf_key" ON "equipe"("cpf");
CREATE INDEX IF NOT EXISTS "equipe_backoffice_id_idx" ON "equipe"("backoffice_id");
CREATE INDEX IF NOT EXISTS "equipe_lideranca_id_idx" ON "equipe"("lideranca_id");
CREATE INDEX IF NOT EXISTS "equipe_tipo_idx" ON "equipe"("tipo");

-- 3) Migrar LIDERANCAS -> equipe (tipo='LIDERANCA')
-- Note: liderancas.id precisa ser preservado, pois comerciais.lideranca_id e
-- gestores.lideranca_id ainda apontam para liderancas.id (e serão reapontados).
INSERT INTO "equipe" (
  "id", "usuario_id", "nome", "cpf", "backoffice_id",
  "tipo", "tipo_lideranca", "funcao", "percentual_comissao",
  "status", "lideranca_id", "created_at", "updated_at"
)
SELECT
  l."id", l."usuario_id", l."nome", l."cpf", l."backoffice_id",
  'LIDERANCA'::"TipoEquipe", l."tipo", l."funcao", 0,
  l."status", NULL, l."created_at", l."updated_at"
FROM "liderancas" l
WHERE NOT EXISTS (SELECT 1 FROM "equipe" e WHERE e."id" = l."id");

-- 4) Migrar COMERCIAIS -> equipe (tipo='COMERCIAL')
-- comerciais.lideranca_id aponta para liderancas.id, que agora também é o id em
-- equipe (preservado no passo 3).
INSERT INTO "equipe" (
  "id", "usuario_id", "nome", "cpf", "backoffice_id",
  "tipo", "tipo_lideranca", "funcao", "percentual_comissao",
  "status", "lideranca_id", "created_at", "updated_at"
)
SELECT
  c."id", c."usuario_id", c."nome", c."cpf", c."backoffice_id",
  'COMERCIAL'::"TipoEquipe", c."tipoLideranca", c."funcao", c."percentual_comissao",
  c."status", c."lideranca_id", c."created_at", c."updated_at"
FROM "comerciais" c
WHERE NOT EXISTS (SELECT 1 FROM "equipe" e WHERE e."id" = c."id");

-- 5) FKs da tabela `equipe`
ALTER TABLE "equipe"
  ADD CONSTRAINT "equipe_backoffice_id_fkey"
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "equipe"
  ADD CONSTRAINT "equipe_lideranca_id_fkey"
  FOREIGN KEY ("lideranca_id") REFERENCES "equipe"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "equipe"
  ADD CONSTRAINT "equipe_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- 6) Criar `metas_equipe` e `comissoes_equipe`, migrar dados de
-- `metas_comerciais` + `metas_liderancas`, e `comissoes_comerciais`.

CREATE TABLE IF NOT EXISTS "metas_equipe" (
    "id" UUID NOT NULL,
    "equipe_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_meta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_atingido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_comissao" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_equipe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "metas_equipe_equipe_id_mes_referencia_key"
  ON "metas_equipe"("equipe_id", "mes_referencia");
CREATE INDEX IF NOT EXISTS "metas_equipe_equipe_id_idx" ON "metas_equipe"("equipe_id");

-- Migrar metas dos comerciais (preserva o id antigo)
INSERT INTO "metas_equipe" (
  "id", "equipe_id", "mes_referencia", "valor_meta", "valor_atingido",
  "valor_comissao", "created_at", "updated_at"
)
SELECT
  "id", "comercial_id", "mes_referencia", "valor_meta", "valor_atingido",
  COALESCE("valor_comissao", 0), "created_at", "updated_at"
FROM "metas_comerciais"
WHERE NOT EXISTS (SELECT 1 FROM "metas_equipe" m WHERE m."id" = "metas_comerciais"."id");

-- Migrar metas das liderancas (preserva o id antigo).
-- Risco de colisão de id entre metas_comerciais e metas_liderancas: caso exista,
-- gera um novo id para evitar violação de PK.
INSERT INTO "metas_equipe" (
  "id", "equipe_id", "mes_referencia", "valor_meta", "valor_atingido",
  "valor_comissao", "created_at", "updated_at"
)
SELECT
  -- se id já existe em metas_equipe (vindo de metas_comerciais), gera novo uuid
  CASE WHEN EXISTS (SELECT 1 FROM "metas_equipe" m WHERE m."id" = ml."id")
       THEN gen_random_uuid()
       ELSE ml."id"
  END,
  ml."lideranca_id", ml."mes_referencia", ml."valor_meta", ml."valor_atingido",
  0, ml."created_at", ml."updated_at"
FROM "metas_liderancas" ml
WHERE NOT EXISTS (
  SELECT 1 FROM "metas_equipe" m
  WHERE m."equipe_id" = ml."lideranca_id" AND m."mes_referencia" = ml."mes_referencia"
);

ALTER TABLE "metas_equipe"
  ADD CONSTRAINT "metas_equipe_equipe_id_fkey"
  FOREIGN KEY ("equipe_id") REFERENCES "equipe"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "comissoes_equipe" (
    "id" UUID NOT NULL,
    "equipe_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_vendas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_comissao" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "StatusComissao" NOT NULL DEFAULT 'CALCULADA',
    "data_pagamento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_equipe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "comissoes_equipe_equipe_id_mes_referencia_key"
  ON "comissoes_equipe"("equipe_id", "mes_referencia");
CREATE INDEX IF NOT EXISTS "comissoes_equipe_equipe_id_idx" ON "comissoes_equipe"("equipe_id");

INSERT INTO "comissoes_equipe" (
  "id", "equipe_id", "mes_referencia", "valor_vendas", "valor_comissao",
  "status", "data_pagamento", "created_at", "updated_at"
)
SELECT
  "id", "comercial_id", "mes_referencia", "valor_vendas", "valor_comissao",
  "status", "data_pagamento", "created_at", "updated_at"
FROM "comissoes_comerciais"
WHERE NOT EXISTS (SELECT 1 FROM "comissoes_equipe" c WHERE c."id" = "comissoes_comerciais"."id");

ALTER TABLE "comissoes_equipe"
  ADD CONSTRAINT "comissoes_equipe_equipe_id_fkey"
  FOREIGN KEY ("equipe_id") REFERENCES "equipe"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- 7) Reapontar FKs que ainda referenciam `comerciais` ou `liderancas`:
--    parceiros.comercial_id, procedimentos_pf.comercial_id,
--    gestores.lideranca_id, consultores_pf.lideranca_id.
-- Como os ids foram preservados (comerciais.id == equipe.id para antigos
-- comerciais e liderancas.id == equipe.id para antigos liderancas), basta
-- dropar a FK antiga e criar nova apontando para equipe.

-- parceiros.comercial_id
ALTER TABLE "parceiros" DROP CONSTRAINT IF EXISTS "parceiros_comercial_id_fkey";
ALTER TABLE "parceiros"
  ADD CONSTRAINT "parceiros_comercial_id_fkey"
  FOREIGN KEY ("comercial_id") REFERENCES "equipe"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- procedimentos_pf.comercial_id
ALTER TABLE "procedimentos_pf" DROP CONSTRAINT IF EXISTS "procedimentos_pf_comercial_id_fkey";
ALTER TABLE "procedimentos_pf"
  ADD CONSTRAINT "procedimentos_pf_comercial_id_fkey"
  FOREIGN KEY ("comercial_id") REFERENCES "equipe"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- gestores.lideranca_id
ALTER TABLE "gestores" DROP CONSTRAINT IF EXISTS "gestores_lideranca_id_fkey";
ALTER TABLE "gestores"
  ADD CONSTRAINT "gestores_lideranca_id_fkey"
  FOREIGN KEY ("lideranca_id") REFERENCES "equipe"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- consultores_pf.lideranca_id
ALTER TABLE "consultores_pf" DROP CONSTRAINT IF EXISTS "consultores_pf_lideranca_id_fkey";
ALTER TABLE "consultores_pf"
  ADD CONSTRAINT "consultores_pf_lideranca_id_fkey"
  FOREIGN KEY ("lideranca_id") REFERENCES "equipe"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- 8) Dropar tabelas antigas (após todos os FKs terem sido reapontados).
-- As tabelas de metas/comissoes antigas não são mais referenciadas.
DROP TABLE IF EXISTS "metas_comerciais";
DROP TABLE IF EXISTS "metas_liderancas";
DROP TABLE IF EXISTS "comissoes_comerciais";
DROP TABLE IF EXISTS "comerciais";
DROP TABLE IF EXISTS "liderancas";

-- 9) Adicionar relação backoffice.equipe[] (já prevista no schema).
-- O schema.prisma declara `equipe Equipe[]` em Backoffice, que só exige o
-- backoffice_id já presente na tabela equipe. Nada a fazer aqui.
