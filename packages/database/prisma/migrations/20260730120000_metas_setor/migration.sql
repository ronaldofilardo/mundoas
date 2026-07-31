-- AlterTable
ALTER TABLE "setores" ADD COLUMN "backoffice_id" UUID;

-- DropIndex
DROP INDEX IF EXISTS "setores_nome_key";

-- CreateIndex
CREATE UNIQUE INDEX "setores_backoffice_id_nome_key" ON "setores"("backoffice_id", "nome");

-- CreateIndex
CREATE INDEX "setores_backoffice_id_idx" ON "setores"("backoffice_id");

-- AddForeignKey
ALTER TABLE "setores" ADD CONSTRAINT "setores_backoffice_id_fkey" FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "metas_consultores_pf" ADD COLUMN "setor_id" UUID;
ALTER TABLE "metas_consultores_pf" ADD COLUMN "criado_por_id" UUID;

-- DropIndex
DROP INDEX IF EXISTS "metas_consultores_pf_consultor_pf_id_mes_referencia_key";

-- CreateIndex
CREATE UNIQUE INDEX "metas_consultores_pf_consultor_pf_id_setor_id_mes_referencia_key" ON "metas_consultores_pf"("consultor_pf_id", "setor_id", "mes_referencia");

-- CreateIndex
CREATE INDEX "metas_consultores_pf_setor_id_idx" ON "metas_consultores_pf"("setor_id");

-- AddForeignKey
ALTER TABLE "metas_consultores_pf" ADD CONSTRAINT "metas_consultores_pf_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
