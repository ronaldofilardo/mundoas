-- Remove GESTOR_PF from TipoUsuario enum
-- No data uses GESTOR_PF, safe to remove

BEGIN;

-- 1. Create new enum without GESTOR_PF
CREATE TYPE "TipoUsuario_new" AS ENUM (
  'GESTOR',
  'CONSULTOR',
  'ADMIN',
  'PARCEIRO',
  'COMERCIAL',
  'LIDERANCA',
  'BACKOFFICE',
  'SUPERVISAO',
  'GERENCIA',
  'GESTOR_PJ'
);

-- 2. Alter column to use new enum (cast via text)
ALTER TABLE "usuarios" ALTER COLUMN "tipo" TYPE "TipoUsuario_new" USING "tipo"::text::"TipoUsuario_new";

-- 3. Drop old enum
DROP TYPE "TipoUsuario";

-- 4. Rename new enum
ALTER TYPE "TipoUsuario_new" RENAME TO "TipoUsuario";

COMMIT;
