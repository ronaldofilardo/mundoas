-- Integridade/idempotência do ledger Parceiros & Pontos.
CREATE UNIQUE INDEX IF NOT EXISTS "mov_pontos_credito_producao_unq"
ON "movimentacoes_pontos" ("referencia_procedimento_id", "origem", "tipo")
WHERE "referencia_procedimento_id" IS NOT NULL
  AND "origem" = 'PRODUCAO_IMPORTADA'
  AND "tipo" = 'CREDITO';

CREATE UNIQUE INDEX IF NOT EXISTS "mov_pontos_estorno_resgate_unq"
ON "movimentacoes_pontos" ("referencia_solicitacao_resgate_id", "origem", "tipo")
WHERE "referencia_solicitacao_resgate_id" IS NOT NULL
  AND "origem" = 'ESTORNO_RESGATE'
  AND "tipo" = 'ESTORNO';
