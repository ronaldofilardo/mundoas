-- Remove GESTOR_PJ dos enums TipoUsuario e PapelGestor (FASE 0 — papel legado)
-- Verificado: 0 linhas com papel='GESTOR_PJ' ou tipo='GESTOR_PJ' no banco.
-- Segue o padrão da migration 20260719000010_remove_gestor_pf_from_tipousuario
-- (PostgreSQL não suporta DROP VALUE em enums; o tipo é recriado via cast).

BEGIN;

-- 1. PapelGestor: recriar sem GESTOR_PJ
CREATE TYPE "PapelGestor_new" AS ENUM ('BACKOFFICE');
ALTER TABLE "usuarios" ALTER COLUMN "papel" TYPE "PapelGestor_new" USING ("papel"::text::"PapelGestor_new");
ALTER TYPE "PapelGestor" RENAME TO "PapelGestor_old";
ALTER TYPE "PapelGestor_new" RENAME TO "PapelGestor";
DROP TYPE "public"."PapelGestor_old";

-- 2. TipoUsuario: recriar sem GESTOR_PJ
CREATE TYPE "TipoUsuario_new" AS ENUM ('GESTOR', 'CONSULTOR', 'ADMIN', 'PARCEIRO', 'COMERCIAL', 'LIDERANCA', 'BACKOFFICE', 'SUPERVISAO', 'GERENCIA', 'CONSULTOR_PF');
ALTER TABLE "usuarios" ALTER COLUMN "tipo" TYPE "TipoUsuario_new" USING ("tipo"::text::"TipoUsuario_new");
ALTER TYPE "TipoUsuario" RENAME TO "TipoUsuario_old";
ALTER TYPE "TipoUsuario_new" RENAME TO "TipoUsuario";
DROP TYPE "public"."TipoUsuario_old";

COMMIT;
