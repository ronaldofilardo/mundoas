-- Backfill funcao para lideranças legadas em PRODUCAO (idempotente).
-- Roda somente onde funcao IS NULL. Reverte mudancas erradas com
--   UPDATE liderancas SET funcao = NULL WHERE cpf IN ('...');

BEGIN;

UPDATE liderancas
SET funcao = 'SUPERVISOR_COMERCIAL'::"FuncaoComercial"
WHERE cpf = '15666403001' AND funcao IS NULL;

UPDATE liderancas
SET funcao = 'GERENTE_CIRE'::"FuncaoComercial"
WHERE cpf = '53051173931' AND funcao IS NULL;

UPDATE liderancas
SET funcao = 'GERENTE_CIRE'::"FuncaoComercial"
WHERE cpf = '06566698027' AND funcao IS NULL;

-- Conferir
SELECT id, nome, cpf, tipo, funcao
FROM liderancas
ORDER BY created_at DESC;

COMMIT;
