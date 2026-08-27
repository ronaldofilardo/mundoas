-- Add delivery SLA to prizes and snapshot it on redemption requests.
ALTER TABLE "premios"
  ADD COLUMN IF NOT EXISTS "prazo_entrega_dias" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "solicitacoes_resgate"
  ADD COLUMN IF NOT EXISTS "prazo_entrega_dias" INTEGER NOT NULL DEFAULT 0;

-- Existing redemption records receive the current prize SLA as their immutable snapshot.
UPDATE "solicitacoes_resgate" AS sr
SET "prazo_entrega_dias" = p."prazo_entrega_dias"
FROM "premios" AS p
WHERE p."id" = sr."premio_id"
  AND sr."prazo_entrega_dias" = 0
  AND p."prazo_entrega_dias" > 0;

ALTER TABLE "premios"
  ADD CONSTRAINT "premios_prazo_entrega_dias_check"
  CHECK ("prazo_entrega_dias" >= 0);

ALTER TABLE "solicitacoes_resgate"
  ADD CONSTRAINT "solicitacoes_resgate_prazo_entrega_dias_check"
  CHECK ("prazo_entrega_dias" >= 0);
