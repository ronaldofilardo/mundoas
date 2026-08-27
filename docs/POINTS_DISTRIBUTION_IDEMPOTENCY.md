# Idempotência da distribuição de pontos

## Regra

Uma produção pode receber no máximo um crédito originado de `PRODUCAO_IMPORTADA`, independentemente do ciclo, da quantidade de tentativas ou do caminho usado para distribuir os pontos.

A referência persistida é `movimentacoes_pontos.referencia_procedimento_id`. O crédito é identificado pela combinação dessa referência com `origem = PRODUCAO_IMPORTADA` e `tipo = CREDITO`.

## Proteções

A aplicação faz uma checagem global antes de exibir a produção como pendente. A proteção definitiva fica no banco, por meio do índice único parcial `mov_pontos_credito_producao_unq`, criado pela migration `20260821000000_hardening_parceiros_pontos`.

Os endpoints individual, em lote e Bônus PF tratam a violação de unicidade como resultado idempotente. Assim, uma segunda tentativa não cria nova movimentação e não expõe erro técnico ao operador. No lote, a resposta informa a quantidade de produções ignoradas; na tela, a produção aparece como `Distribuído`.

## Aplicação

A migration de hardening já faz parte do histórico do projeto. Em uma instalação atualizada, use somente:

```powershell
cd C:\apps\mundoas\packages\database
$env:DATABASE_URL = 'postgresql://postgres:123456@localhost:5432\asa_db'
pnpm exec prisma migrate deploy
pnpm exec prisma generate
Remove-Item Env:DATABASE_URL
```

Não executar `prisma migrate reset`, `prisma db push` ou comandos equivalentes.

## Validação

Os testes de contrato cobrem o índice único, a checagem global e o tratamento de concorrência nos três endpoints. A validação desta alteração passou com `tsc --noEmit`, `prisma validate` e 4 testes de contrato. Os testes de integração que criam dados exigem PostgreSQL ativo em `localhost:5432` e devem ser executados no ambiente Windows com o banco local disponível.
