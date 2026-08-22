-- CreateTable comissoes_consultor_pf
CREATE TABLE "comissoes_consultor_pf" (
    "id" UUID NOT NULL,
    "consultor_pf_id" UUID NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "valor_producao" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "valor_comissao" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "status" "StatusComissao" NOT NULL DEFAULT 'CALCULADA',
    "data_pagamento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_consultor_pf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_consultor_pf_consultor_pf_id_mes_referencia_key" ON "comissoes_consultor_pf"("consultor_pf_id", "mes_referencia");

CREATE INDEX "comissoes_consultor_pf_consultor_pf_id_idx" ON "comissoes_consultor_pf"("consultor_pf_id");

-- AddForeignKey
ALTER TABLE "comissoes_consultor_pf" ADD CONSTRAINT "comissoes_consultor_pf_consultor_pf_id_fkey" FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
