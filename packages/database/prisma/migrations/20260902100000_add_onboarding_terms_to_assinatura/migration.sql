-- Onboarding do fluxo mundoAS (Plano de Implementação): aceite jurídico e
-- plano escolhido passam a viver na tabela "assinaturas" (1:1 com
-- "backoffices"), reaproveitando os campos asaas_customer_id /
-- asaas_subscription_id que já existiam aqui.

-- Novos valores de status para o mapa de estados do middleware:
--   PENDENTE_TERMOS    -> ainda não aceitou termos/LGPD/débito recorrente
--   PENDENTE_PAGAMENTO -> aceitou os termos mas ainda não tem assinatura Asaas ativa
ALTER TYPE "StatusAssinatura" ADD VALUE IF NOT EXISTS 'PENDENTE_TERMOS';
ALTER TYPE "StatusAssinatura" ADD VALUE IF NOT EXISTS 'PENDENTE_PAGAMENTO';

-- Plano contratado (mensal R$350 / anual R$3.500) — usado no checkout e na
-- criação da Subscription no Asaas.
DO $$ BEGIN
  CREATE TYPE "PlanoAssinatura" AS ENUM ('MENSAL', 'ANUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "assinaturas"
  ADD COLUMN IF NOT EXISTS "plano_assinatura" "PlanoAssinatura";

ALTER TABLE "assinaturas"
  ADD COLUMN IF NOT EXISTS "termos_aceitos_em" TIMESTAMP(3);

ALTER TABLE "assinaturas"
  ADD COLUMN IF NOT EXISTS "termos_aceitos_ip" VARCHAR(45);

ALTER TABLE "assinaturas"
  ADD COLUMN IF NOT EXISTS "termos_versao" VARCHAR(20);
