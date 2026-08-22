-- CreateTable
CREATE TABLE "regras_faltas" (
    "id" UUID NOT NULL,
    "backoffice_id" UUID NOT NULL,
    "consultor_unidade_com_falta" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "consultor_unidade_sem_falta" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "supervisor_atendimento_com_falta" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "supervisor_atendimento_sem_falta" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gerente_comercial_com_falta" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gerente_comercial_sem_falta" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_faltas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regras_faltas_backoffice_id_key" ON "regras_faltas"("backoffice_id");

-- CreateIndex
CREATE INDEX "regras_faltas_backoffice_id_idx" ON "regras_faltas"("backoffice_id");

-- AddForeignKey
ALTER TABLE "regras_faltas" ADD CONSTRAINT "regras_faltas_backoffice_id_fkey" FOREIGN KEY ("backoffice_id") REFERENCES "backoffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
