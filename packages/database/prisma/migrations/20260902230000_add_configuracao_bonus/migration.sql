-- CreateTable
CREATE TABLE "configuracoes_bonus" (
    "id" UUID NOT NULL,
    "valor_por_ponto" DECIMAL(10,2) NOT NULL,
    "tipo_arredondamento" "TipoArredondamento" NOT NULL DEFAULT 'PADRAO',
    "vigente_desde" TIMESTAMP(3) NOT NULL,
    "vigente_ate" TIMESTAMP(3),
    "criado_por" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "backoffice_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "configuracoes_bonus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "configuracoes_bonus_backoffice_id_idx" ON "configuracoes_bonus"("backoffice_id");

-- CreateIndex
CREATE INDEX "configuracoes_bonus_vigente_desde_idx" ON "configuracoes_bonus"("vigente_desde");

-- AddForeignKey
ALTER TABLE "configuracoes_bonus" ADD CONSTRAINT "configuracoes_bonus_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;
