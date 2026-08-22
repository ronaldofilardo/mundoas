ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'CONSULTOR_PF';

CREATE TABLE "consultores_pf" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "lideranca_id" UUID NOT NULL,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultores_pf_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metas_consultores_pf" (
    "id" UUID NOT NULL,
    "consultor_pf_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_meta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_atingido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_consultores_pf_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metas_liderancas" (
    "id" UUID NOT NULL,
    "lideranca_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_meta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_atingido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_liderancas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consultores_pf_usuario_id_key" ON "consultores_pf"("usuario_id");
CREATE UNIQUE INDEX "consultores_pf_cpf_key" ON "consultores_pf"("cpf");
CREATE INDEX "consultores_pf_lideranca_id_idx" ON "consultores_pf"("lideranca_id");

CREATE UNIQUE INDEX "metas_consultores_pf_consultor_pf_id_mes_referencia_key" ON "metas_consultores_pf"("consultor_pf_id", "mes_referencia");
CREATE INDEX "metas_consultores_pf_consultor_pf_id_idx" ON "metas_consultores_pf"("consultor_pf_id");

CREATE UNIQUE INDEX "metas_liderancas_lideranca_id_mes_referencia_key" ON "metas_liderancas"("lideranca_id", "mes_referencia");
CREATE INDEX "metas_liderancas_lideranca_id_idx" ON "metas_liderancas"("lideranca_id");

ALTER TABLE "consultores_pf" ADD CONSTRAINT "consultores_pf_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultores_pf" ADD CONSTRAINT "consultores_pf_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "metas_consultores_pf" ADD CONSTRAINT "metas_consultores_pf_consultor_pf_id_fkey" FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "metas_liderancas" ADD CONSTRAINT "metas_liderancas_lideranca_id_fkey" FOREIGN KEY ("lideranca_id") REFERENCES "liderancas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
