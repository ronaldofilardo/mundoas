-- AlterTable
ALTER TABLE "regras_faltas" ALTER COLUMN "consultor_unidade_com_falta" SET DATA TYPE DECIMAL(9,4),
ALTER COLUMN "consultor_unidade_sem_falta" SET DATA TYPE DECIMAL(9,4),
ALTER COLUMN "supervisor_atendimento_com_falta" SET DATA TYPE DECIMAL(9,4),
ALTER COLUMN "supervisor_atendimento_sem_falta" SET DATA TYPE DECIMAL(9,4),
ALTER COLUMN "gerente_comercial_com_falta" SET DATA TYPE DECIMAL(9,4),
ALTER COLUMN "gerente_comercial_sem_falta" SET DATA TYPE DECIMAL(9,4);
