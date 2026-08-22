CREATE TABLE IF NOT EXISTS "backoffices" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "percentual_comissao_default" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "percentual_comissao_max" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backoffices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "backoffices_cpf_key" ON "backoffices"("cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "backoffices_usuario_id_key" ON "backoffices"("usuario_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'backoffices_usuario_id_fkey'
        AND conrelid = 'backoffices'::regclass
    ) THEN
        ALTER TABLE "backoffices" ADD CONSTRAINT "backoffices_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
