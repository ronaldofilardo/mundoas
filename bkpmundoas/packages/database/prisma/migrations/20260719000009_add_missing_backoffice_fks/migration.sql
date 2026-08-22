-- Add missing foreign key constraints for backoffice_id columns

BEGIN;

ALTER TABLE "configuracoes_pontos" DROP CONSTRAINT IF EXISTS "configuracoes_pontos_backoffice_id_fkey";
ALTER TABLE "configuracoes_pontos" ADD CONSTRAINT "configuracoes_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ciclos_pontos" DROP CONSTRAINT IF EXISTS "ciclos_pontos_backoffice_id_fkey";
ALTER TABLE "ciclos_pontos" ADD CONSTRAINT "ciclos_pontos_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "premios" DROP CONSTRAINT IF EXISTS "premios_backoffice_id_fkey";
ALTER TABLE "premios" ADD CONSTRAINT "premios_backoffice_id_fkey" 
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
