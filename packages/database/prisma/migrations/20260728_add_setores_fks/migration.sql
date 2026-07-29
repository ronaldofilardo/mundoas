ALTER TABLE "consultor_pf_setores" ADD CONSTRAINT "consultor_pf_setores_consultor_pf_id_fkey" FOREIGN KEY ("consultor_pf_id") REFERENCES "consultores_pf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consultor_pf_setores" ADD CONSTRAINT "consultor_pf_setores_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
