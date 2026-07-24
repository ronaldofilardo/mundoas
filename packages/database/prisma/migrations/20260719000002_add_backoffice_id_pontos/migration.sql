ALTER TABLE "configuracoes_pontos" ADD COLUMN IF NOT EXISTS "backoffice_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
CREATE INDEX IF NOT EXISTS "configuracoes_pontos_backoffice_id_idx" ON "configuracoes_pontos"("backoffice_id");
CREATE INDEX IF NOT EXISTS "configuracoes_pontos_vigente_desde_idx" ON "configuracoes_pontos"("vigente_desde");

ALTER TABLE "ciclos_pontos" ADD COLUMN IF NOT EXISTS "backoffice_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
CREATE INDEX IF NOT EXISTS "ciclos_pontos_backoffice_id_idx" ON "ciclos_pontos"("backoffice_id");
CREATE INDEX IF NOT EXISTS "ciclos_pontos_backoffice_id_status_idx" ON "ciclos_pontos"("backoffice_id", "status");
CREATE INDEX IF NOT EXISTS "ciclos_pontos_status_idx" ON "ciclos_pontos"("status");
