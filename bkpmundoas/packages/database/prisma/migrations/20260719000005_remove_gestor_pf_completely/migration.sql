-- Remove all gestor_pf references from database
-- This migration completes the removal of gestor_pf in favor of backoffice

-- 1. Drop foreign key constraints referencing gestores_pf
ALTER TABLE IF EXISTS "ciclos_pontos" DROP CONSTRAINT IF EXISTS "ciclos_pontos_gestor_pf_id_fkey";
ALTER TABLE IF EXISTS "configuracoes_pontos" DROP CONSTRAINT IF EXISTS "configuracoes_pontos_gestor_pf_id_fkey";
ALTER TABLE IF EXISTS "premios" DROP CONSTRAINT IF EXISTS "premios_gestor_pf_id_fkey";
ALTER TABLE IF EXISTS "uploads_planilha_pf" DROP CONSTRAINT IF EXISTS "uploads_planilha_pf_gestor_pf_id_fkey";

-- 2. Drop indexes related to gestor_pf_id
DROP INDEX IF EXISTS "ciclos_pontos_gestor_pf_id_idx";
DROP INDEX IF EXISTS "ciclos_pontos_gestor_pf_id_status_idx";
DROP INDEX IF EXISTS "configuracoes_pontos_gestor_pf_id_idx";
DROP INDEX IF EXISTS "premios_gestor_pf_id_idx";
DROP INDEX IF EXISTS "uploads_planilha_pf_gestor_pf_id_idx";

-- 3. Drop gestor_pf_id columns
ALTER TABLE IF EXISTS "ciclos_pontos" DROP COLUMN IF EXISTS "gestor_pf_id";
ALTER TABLE IF EXISTS "configuracoes_pontos" DROP COLUMN IF EXISTS "gestor_pf_id";
ALTER TABLE IF EXISTS "premios" DROP COLUMN IF EXISTS "gestor_pf_id";
ALTER TABLE IF EXISTS "uploads_planilha_pf" DROP COLUMN IF EXISTS "gestor_pf_id";

-- 4. Drop gestores_pf table
DROP TABLE IF EXISTS "gestores_pf" CASCADE;
