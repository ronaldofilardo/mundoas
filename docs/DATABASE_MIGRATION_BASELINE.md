# Baseline de migrations do MundoAS

## Estado validado

O schema Prisma atual é a fonte estrutural do MundoAS. O banco de teste `asa_db_test` foi validado contra os modelos mapeados, e o teste de drift confirmou a existência física das tabelas necessárias. O modelo órfão `PasswordResetToken` foi removido do schema porque sua tabela já havia sido removida por migration.

## Política operacional

A rotina de produção deve usar `prisma migrate deploy` somente depois de verificar o histórico remoto e o drift. `prisma db push --accept-data-loss` não deve ser usado como procedimento normal de deploy. Ele fica restrito a reconstruções autorizadas, documentadas e executadas fora do fluxo normal de publicação.

## Procedimento para futuras alterações

1. Alterar o schema local e gerar uma migration revisada.
2. Executar `prisma validate`, geração do client e o teste de drift contra `asa_db_test`.
3. Executar a migration em banco de homologação limpo.
4. Conferir `prisma migrate status` e contagens/constraints antes da produção.
5. Aplicar com `pnpm --filter @asa/database exec prisma migrate deploy`.
6. Registrar o nome da migration, o commit e o resultado da validação.

## Neon reconstruído

Como o Neon foi sincronizado estruturalmente por reconstrução autorizada, seu histórico remoto precisa ser tratado como baseline operacional antes de novas migrations. Não se deve marcar migrations como aplicadas sem confirmar que todos os objetos correspondentes existem, nem reaplicar migrations destrutivas já executadas.

## Checklist de release

| Controle | Evidência esperada |
|---|---|
| Schema válido | Saída aprovada de `prisma validate`. |
| Banco de testes sem drift | Teste `schema-drift.test.ts` verde. |
| Migration revisada | Diretório versionado em `packages/database/prisma/migrations`. |
| Produção identificada | `DATABASE_URL` confirmado na Vercel, sem imprimir o segredo. |
| Rollback avaliado | Plano documentado quando houver alteração destrutiva. |

[1]: ../audit/RELATORIO_AUDITORIA_CODIGO_E_CONTRATOS.md

## References

[1]: ../audit/RELATORIO_AUDITORIA_CODIGO_E_CONTRATOS.md
