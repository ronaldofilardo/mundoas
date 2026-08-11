-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'INADIMPLENTE', 'BLOQUEADA_MANUAL', 'CORTESIA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusPagamentoFatura" AS ENUM ('PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'DELETED');

-- CreateEnum
CREATE TYPE "FormaPagamentoFatura" AS ENUM ('BOLETO', 'PIX');

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" UUID NOT NULL,
    "backoffice_id" UUID NOT NULL,
    "asaas_customer_id" VARCHAR(100),
    "asaas_subscription_id" VARCHAR(100),
    "status_assinatura" "StatusAssinatura" NOT NULL DEFAULT 'ATIVA',
    "bloqueado_em" TIMESTAMP(3),
    "bloqueado_por_usuario_id" UUID,
    "motivo_bloqueio" TEXT,
    "cortesia_desde" TIMESTAMP(3),
    "cortesia_por_usuario_id" UUID,
    "motivo_cortesia" TEXT,
    "cortesia_expira_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturas_asaas" (
    "id" UUID NOT NULL,
    "assinatura_id" UUID NOT NULL,
    "asaas_payment_id" VARCHAR(100),
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "status_pagamento" "StatusPagamentoFatura" NOT NULL DEFAULT 'PENDING',
    "forma_pagamento" "FormaPagamentoFatura",
    "link_fatura" TEXT,
    "link_boleto" TEXT,
    "pix_copia_cola" TEXT,
    "pix_qrcode_base64" TEXT,
    "pago_manualmente" BOOLEAN NOT NULL DEFAULT false,
    "marcado_pago_por_usuario_id" UUID,
    "marcado_pago_em" TIMESTAMP(3),
    "pago_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faturas_asaas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asaas_webhook_events" (
    "id" UUID NOT NULL,
    "asaas_event_id" VARCHAR(150),
    "tipo_evento" VARCHAR(100) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "processado_em" TIMESTAMP(3),
    "erro" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_backoffice_id_key" ON "assinaturas"("backoffice_id");

-- CreateIndex
CREATE INDEX "assinaturas_status_assinatura_idx" ON "assinaturas"("status_assinatura");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_asaas_asaas_payment_id_key" ON "faturas_asaas"("asaas_payment_id");

-- CreateIndex
CREATE INDEX "faturas_asaas_assinatura_id_idx" ON "faturas_asaas"("assinatura_id");

-- CreateIndex
CREATE INDEX "faturas_asaas_status_pagamento_idx" ON "faturas_asaas"("status_pagamento");

-- CreateIndex
CREATE UNIQUE INDEX "asaas_webhook_events_asaas_event_id_key" ON "asaas_webhook_events"("asaas_event_id");

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_backoffice_id_fkey" FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas_asaas" ADD CONSTRAINT "faturas_asaas_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "assinaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "metas_consultores_pf_consultor_pf_id_setor_id_mes_referencia_ke" RENAME TO "metas_consultores_pf_consultor_pf_id_setor_id_mes_referenci_key";
