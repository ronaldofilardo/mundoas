-- Remove GESTOR_PF from PapelGestor enum
-- No data uses GESTOR_PF, safe to remove

BEGIN;

-- 1. Create new enum without GESTOR_PF
CREATE TYPE "PapelGestor_new" AS ENUM ('GESTOR_PJ', 'BACKOFFICE');

-- 2. Alter column to use new enum (cast via text)
ALTER TABLE "usuarios" ALTER COLUMN "papel" TYPE "PapelGestor_new" USING "papel"::text::"PapelGestor_new";

-- 3. Drop old enum
DROP TYPE "PapelGestor";

-- 4. Rename new enum
ALTER TYPE "PapelGestor_new" RENAME TO "PapelGestor";

COMMIT;
