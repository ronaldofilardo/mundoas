DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'liderancas' AND column_name = 'gestor_pf_id'
    ) THEN
        ALTER TABLE "liderancas" RENAME COLUMN "gestor_pf_id" TO "backoffice_id";
    END IF;
END $$;

DROP INDEX IF EXISTS "liderancas_gestor_pf_id_idx";

CREATE INDEX IF NOT EXISTS "liderancas_backoffice_id_idx" ON "liderancas"("backoffice_id");
