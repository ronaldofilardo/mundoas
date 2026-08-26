# Baseline estrutural executado — MundoAS

**Data do registro:** 26 de agosto de 2026  
**Escopo:** baseline reprodutível do schema e do diretório de migrations versionadas.  
**Banco local de testes:** `asa_db_test` (PostgreSQL 17).  
**Banco de produção:** Neon; nenhuma alteração é executada por este documento.

## Identidade do estado versionado

| Item | Valor |
|---|---|
| SHA-256 de `packages/database/prisma/schema.prisma` | `2b6f78dc385ab6841a24924f2f091f721efe256c23664e77d3000ec19b9c661b` |
| Diretórios de migration | 61 |
| Arquivos `migration.sql` | 61 |
| Última migration versionada | `20260826030000_restore_total_pago_procedimentos_pf` |
| SHA-256 da última migration | `0bccf8c5a7782f513f689770b2aef13b2f665b3236472bff5c41f8962a5d51d9` |
| Domínios legados no schema | Estabelecimento, Cupons e Consultas: ausentes |
| Modelo órfão | `PasswordResetToken`: ausente |
| Tabelas de itens de regras | `regras_comerciais_itens`, `regras_gestores_itens`, `regras_faltas_itens`: versionadas |

## Procedimento obrigatório de validação

O baseline é considerado reproduzível quando os comandos abaixo forem executados a partir da raiz em um banco de teste limpo, sem `db push` destrutivo:

```powershell
cd C:\apps\mundoas
pnpm --filter @asa/database exec prisma validate --schema prisma/schema.prisma
pnpm --filter @asa/database exec prisma migrate deploy --schema prisma/schema.prisma
pnpm --filter @asa/database exec prisma migrate status --schema prisma/schema.prisma
pnpm --filter @asa/database exec vitest run --reporter=dot
```

O `DATABASE_URL` de testes deve apontar exclusivamente para `asa_db_test`. A produção Neon deve ser validada separadamente com `migrate status` e inspeção de drift, sem imprimir a URL ou credenciais.

## Limite de segurança

Este artefato **não marca migrations como aplicadas**, não altera `_prisma_migrations`, não executa `db push`, não executa `DROP TABLE` e não modifica o Neon. A reconstrução estrutural anterior do Neon foi autorizada e deve ser reconciliada com o histórico remoto por um procedimento operacional separado, com snapshot do catálogo, comparação de hashes/objetos e aprovação antes de qualquer `migrate resolve`.

## Critério de aceite

O baseline será considerado plenamente fechado somente quando houver evidência anexada de: `prisma validate` aprovado; `migrate deploy` aprovado em banco limpo; `migrate status` sem divergência; teste de drift verde em `asa_db_test`; e `migrate status` do Neon compatível com o mesmo estado versionado.

Este documento complementa, mas não substitui, `docs/DATABASE_MIGRATION_BASELINE.md` e `packages/database/prisma/MIGRATION_POLICY.md`.
