ALTER TABLE "procedimentos_pf" ADD COLUMN "consultor_pf_id" UUID;

CREATE INDEX "procedimentos_pf_consultor_pf_id_idx" ON "procedimentos_pf"("consultor_pf_id");

ALTER TABLE "procedimentos_pf" ADD CONSTRAINT "procedimentos_pf_consultor_pf_id_fkey" FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE SET NULL ON UPDATE CASCADE;
