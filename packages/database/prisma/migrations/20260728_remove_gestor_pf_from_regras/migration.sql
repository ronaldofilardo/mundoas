-- Remove gestor_pf_id residual de regras_comerciais e regras_gestores.
-- A migration 20260719000005_remove_gestor_pf_completely removeu gestor_pf_id
-- em outras tabelas (ciclos_pontos, configuracoes_pontos, premios, uploads_planilha_pf)
-- mas esqueceu destas duas. O schema.prisma ja declara apenas backoffice_id.

BEGIN;

-- regras_comerciais
ALTER TABLE "regras_comerciais" DROP CONSTRAINT IF EXISTS "regras_comerciais_gestor_pf_id_fkey";
DROP INDEX IF EXISTS "regras_comerciais_gestor_pf_id_idx";
DROP INDEX IF EXISTS "regras_comerciais_gestor_pf_id_key";
ALTER TABLE "regras_comerciais" DROP COLUMN IF EXISTS "gestor_pf_id";

-- regras_gestores
ALTER TABLE "regras_gestores" DROP CONSTRAINT IF EXISTS "regras_gestores_gestor_pf_id_fkey";
DROP INDEX IF EXISTS "regras_gestores_gestor_pf_id_idx";
DROP INDEX IF EXISTS "regras_gestores_gestor_pf_id_key";
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "gestor_pf_id";

COMMIT;
