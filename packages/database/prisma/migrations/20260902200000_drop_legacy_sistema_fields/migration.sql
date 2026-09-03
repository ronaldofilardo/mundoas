-- Fase 1b: remover colunas Decimal hardcoded de regras_comerciais/gestores/faltas
-- e das tabelas de versão. Itens CUSTOM são a fonte única da verdade.

-- regras_comerciais
ALTER TABLE "regras_comerciais" DROP COLUMN IF EXISTS "cartao_acesso_saude";
ALTER TABLE "regras_comerciais" DROP COLUMN IF EXISTS "cire_ativo";
ALTER TABLE "regras_comerciais" DROP COLUMN IF EXISTS "cire_receptivo";
ALTER TABLE "regras_comerciais" DROP COLUMN IF EXISTS "franchising_acesso";
ALTER TABLE "regras_comerciais" DROP COLUMN IF EXISTS "franchising_cartao";
ALTER TABLE "regras_comerciais" DROP COLUMN IF EXISTS "unidade";

-- regras_gestores
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "gerente_cire";
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "supervisor_ativo";
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "supervisor_receptivo";
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "supervisor_franquia";
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "supervisor_atendimento";
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "gerente_atendimento";
ALTER TABLE "regras_gestores" DROP COLUMN IF EXISTS "supervisor_comercial";

-- regras_faltas
ALTER TABLE "regras_faltas" DROP COLUMN IF EXISTS "consultor_unidade_com_falta";
ALTER TABLE "regras_faltas" DROP COLUMN IF EXISTS "consultor_unidade_sem_falta";
ALTER TABLE "regras_faltas" DROP COLUMN IF EXISTS "supervisor_atendimento_com_falta";
ALTER TABLE "regras_faltas" DROP COLUMN IF EXISTS "supervisor_atendimento_sem_falta";
ALTER TABLE "regras_faltas" DROP COLUMN IF EXISTS "gerente_comercial_com_falta";
ALTER TABLE "regras_faltas" DROP COLUMN IF EXISTS "gerente_comercial_sem_falta";

-- regras_comerciais_versoes
ALTER TABLE "regras_comerciais_versoes" DROP COLUMN IF EXISTS "cartao_acesso_saude";
ALTER TABLE "regras_comerciais_versoes" DROP COLUMN IF EXISTS "cire_ativo";
ALTER TABLE "regras_comerciais_versoes" DROP COLUMN IF EXISTS "cire_receptivo";
ALTER TABLE "regras_comerciais_versoes" DROP COLUMN IF EXISTS "franchising_acesso";
ALTER TABLE "regras_comerciais_versoes" DROP COLUMN IF EXISTS "franchising_cartao";
ALTER TABLE "regras_comerciais_versoes" DROP COLUMN IF EXISTS "unidade";

-- regras_gestores_versoes
ALTER TABLE "regras_gestores_versoes" DROP COLUMN IF EXISTS "gerente_cire";
ALTER TABLE "regras_gestores_versoes" DROP COLUMN IF EXISTS "supervisor_ativo";
ALTER TABLE "regras_gestores_versoes" DROP COLUMN IF EXISTS "supervisor_receptivo";
ALTER TABLE "regras_gestores_versoes" DROP COLUMN IF EXISTS "supervisor_franquia";
ALTER TABLE "regras_gestores_versoes" DROP COLUMN IF EXISTS "supervisor_atendimento";
ALTER TABLE "regras_gestores_versoes" DROP COLUMN IF EXISTS "gerente_atendimento";
ALTER TABLE "regras_gestores_versoes" DROP COLUMN IF EXISTS "supervisor_comercial";
