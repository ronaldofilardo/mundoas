-- A-05: histórico de regras financeiras por competência.

CREATE TABLE "regras_comerciais_versoes" (
  "id" uuid NOT NULL,
  "regra_comercial_id" uuid NOT NULL,
  "competencia" varchar(7) NOT NULL,
  "cartao_acesso_saude" decimal(5,2) NOT NULL DEFAULT 0,
  "cire_ativo" decimal(5,2) NOT NULL DEFAULT 0,
  "cire_receptivo" decimal(5,2) NOT NULL DEFAULT 0,
  "franchising_acesso" decimal(5,2) NOT NULL DEFAULT 0,
  "franchising_cartao" decimal(5,2) NOT NULL DEFAULT 0,
  "unidade" decimal(5,2) NOT NULL DEFAULT 0,
  "criado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "regras_comerciais_versoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "regras_gestores_versoes" (
  "id" uuid NOT NULL,
  "regra_gestor_id" uuid NOT NULL,
  "competencia" varchar(7) NOT NULL,
  "gerente_cire" decimal(5,2) NOT NULL DEFAULT 0,
  "supervisor_ativo" decimal(5,2) NOT NULL DEFAULT 0,
  "supervisor_receptivo" decimal(5,2) NOT NULL DEFAULT 0,
  "supervisor_franquia" decimal(5,2) NOT NULL DEFAULT 0,
  "supervisor_atendimento" decimal(5,2) NOT NULL DEFAULT 0,
  "gerente_atendimento" decimal(5,2) NOT NULL DEFAULT 0,
  "supervisor_comercial" decimal(5,2) NOT NULL DEFAULT 0,
  "criado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "regras_gestores_versoes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "regras_comerciais_versoes"
  ADD CONSTRAINT "regras_comerciais_versoes_regra_comercial_id_fkey"
  FOREIGN KEY ("regra_comercial_id") REFERENCES "regras_comerciais"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regras_gestores_versoes"
  ADD CONSTRAINT "regras_gestores_versoes_regra_gestor_id_fkey"
  FOREIGN KEY ("regra_gestor_id") REFERENCES "regras_gestores"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "regras_comerciais_versoes_regra_competencia_key"
  ON "regras_comerciais_versoes"("regra_comercial_id", "competencia");
CREATE INDEX "regras_comerciais_versoes_competencia_idx"
  ON "regras_comerciais_versoes"("competencia");
CREATE UNIQUE INDEX "regras_gestores_versoes_regra_competencia_key"
  ON "regras_gestores_versoes"("regra_gestor_id", "competencia");
CREATE INDEX "regras_gestores_versoes_competencia_idx"
  ON "regras_gestores_versoes"("competencia");

ALTER TABLE "regras_comerciais_versoes"
  ADD CONSTRAINT "regras_comerciais_versoes_competencia_format_chk"
  CHECK ("competencia" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
ALTER TABLE "regras_gestores_versoes"
  ADD CONSTRAINT "regras_gestores_versoes_competencia_format_chk"
  CHECK ("competencia" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
