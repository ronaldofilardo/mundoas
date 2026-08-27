# Política segura de migrations do MundoAS

## Objetivo

O banco de desenvolvimento e o banco de testes não devem ser formatados, resetados ou recriados a cada alteração do schema. Toda mudança deve ser representada por uma migration incremental revisável e aplicada com `prisma migrate deploy`.

## Comandos oficiais

| Finalidade | Comando | Efeito |
|---|---|---|
| Verificar o alvo | `pnpm db:safety-check` | Confirma o banco local permitido e a política ativa. |
| Consultar migrations | `pnpm db:migrate:status` | Apenas consulta o estado do histórico. |
| Criar migration | `pnpm db:migration:create --name nome_da_mudanca` | Gera `migration.sql` para revisão; não aplica alterações. |
| Aplicar migration | `pnpm db:migrate` | Aplica somente migrations pendentes, sem reset. |
| Rodar testes web | `pnpm --filter @asa/web test` | O bootstrap aplica migrations pendentes em `asa_db_test`; não executa reset. |

## Comandos proibidos pelos scripts do projeto

Os aliases `migrate:dev`, `db:push`, `migrate reset` e `db drop` são bloqueados pelo guardião `scripts/prisma-safe.cjs`. A intenção é impedir que um comando de desenvolvimento apague dados por acidente ou trate drift como motivo para destruir o banco.

A criação de uma migration potencialmente destrutiva também é bloqueada por padrão. Se uma remoção for realmente necessária, ela exige revisão explícita do SQL e a variável de confirmação `ALLOW_DESTRUCTIVE_MIGRATION=I_UNDERSTAND`; essa exceção deve ser usada somente após backup e aprovação.

## Fluxo recomendado

Primeiro altere `packages/database/prisma/schema.prisma`. Em seguida, confirme que `DATABASE_URL` aponta para `asa_db` ou `asa_db_test`, execute `pnpm db:migration:create --name descricao_curta`, revise o SQL gerado e verifique se não há `DROP`, `TRUNCATE` ou `DELETE` indevido. Depois execute `pnpm db:migrate` para aplicar a migration. Por fim, gere o Prisma Client e execute os testes relevantes.

O comando de aplicação é deliberadamente separado da criação: gerar uma migration não muda o banco; aplicar uma migration não recria tabelas existentes. Em caso de divergência entre o histórico Prisma e o banco, o processo deve parar para investigação, e não executar reset automático.

## Proteção de ambiente

O bootstrap de testes aceita somente `asa_db_test`. O guardião local aceita `asa_db` e `asa_db_test`, rejeitando bancos remotos ou nomes desconhecidos. Credenciais nunca são impressas nos logs; apenas host, porta e nome do banco são exibidos.

## Validação automatizada

A política é coberta por `scripts/prisma-safe.test.cjs`, que verifica o bloqueio de `migrate reset`, `db push` e `migrate dev`, a aprovação dos bancos locais esperados e a rejeição de um banco remoto.
