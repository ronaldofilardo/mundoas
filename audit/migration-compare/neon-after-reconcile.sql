-- DropForeignKey
ALTER TABLE "movimentacoes_pontos" DROP CONSTRAINT "movimentacoes_pontos_consultor_pf_id_fkey";

-- DropForeignKey
ALTER TABLE "solicitacoes_resgate" DROP CONSTRAINT "solicitacoes_resgate_consultor_pf_id_fkey";

-- DropIndex
DROP INDEX "ciclos_pontos_backoffice_id_publico_status_idx";

-- DropTable
DROP TABLE "password_reset_tokens";

-- AddForeignKey
ALTER TABLE "movimentacoes_pontos" ADD CONSTRAINT "movimentacoes_pontos_consultor_pf_id_fkey" FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_resgate" ADD CONSTRAINT "solicitacoes_resgate_consultor_pf_id_fkey" FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

