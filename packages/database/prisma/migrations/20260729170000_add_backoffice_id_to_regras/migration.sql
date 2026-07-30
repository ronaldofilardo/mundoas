-- Adiciona backoffice_id em regras_comerciais e regras_gestores.
-- A migration 20260728_remove_gestor_pf_from_regras removeu o antigo FK gestor_pf_id,
-- mas o schema.prisma ja declara backoffice_id como FK e unique. Esta migration
-- adiciona a coluna, o indice unico e a FK com CASCADE.
-- Tabelas verificadas como vazias antes da migration, portanto NOT NULL sem default e seguro.

BEGIN;

-- regras_comerciais
ALTER TABLE "regras_comerciais" ADD COLUMN "backoffice_id" UUID NOT NULL;
CREATE UNIQUE INDEX "regras_comerciais_backoffice_id_key" ON "regras_comerciais"("backoffice_id");
CREATE INDEX "regras_comerciais_backoffice_id_idx" ON "regras_comerciais"("backoffice_id");
ALTER TABLE "regras_comerciais" ADD CONSTRAINT "regras_comerciais_backoffice_id_fkey"
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- regras_gestores
ALTER TABLE "regras_gestores" ADD COLUMN "backoffice_id" UUID NOT NULL;
CREATE UNIQUE INDEX "regras_gestores_backoffice_id_key" ON "regras_gestores"("backoffice_id");
CREATE INDEX "regras_gestores_backoffice_id_idx" ON "regras_gestores"("backoffice_id");
ALTER TABLE "regras_gestores" ADD CONSTRAINT "regras_gestores_backoffice_id_fkey"
  FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
