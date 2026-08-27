# Relatório final de testes reais — MundoAS

**Escopo:** alterações acumuladas na conversa, incluindo Bônus para Consultor PF, isolamento de carteiras e ciclos, reset auditável, distribuição de produção, regras por backoffice, setores, Primeiro Acesso, Novo Consultor PF e proteção contra reset/formatação do banco.

**Ambiente de execução:** projeto em `/home/ubuntu/mundoas_current_work`, Node.js com pnpm, Prisma 6.19.2, PostgreSQL esperado em `localhost:5432`, banco `asa_db_test`.

## Resultado executivo

A aprovação é **parcial**. Os testes unitários e de contrato das funcionalidades principais passaram, mas não é correto declarar a suíte completa verde porque o PostgreSQL não estava acessível neste ambiente. O build compilou e passou na verificação de tipos, porém ficou interrompido durante a geração estática do Next.js após registrar uso dinâmico da rota administrativa.

| Validação | Resultado | Evidência |
|---|---:|---|
| Proteção anti-reset/anti-`db push` | **5/5 testes aprovados** | `database-validation.log` |
| Testes web focados por funcionalidade | **12 arquivos aprovados; 87 testes aprovados** | `web-unit-recalculated-summary.json` |
| Primeiro Acesso funcional | **5/5 aprovados** | `feature-test-results.txt` |
| Primeiro Acesso UI | **3/3 aprovados** | `feature-test-results.txt` |
| Bônus Consultor PF | **9/9 aprovados** | `feature-test-results.txt` |
| Novo Consultor PF/modal | **2/2 aprovados** | `feature-test-results.txt` |
| Ciclos CRUD | **4/4 aprovados** | `feature-test-results.txt` |
| Aba de pontos/configuração | **42/42 aprovados** | `feature-test-results.txt` |
| Escopo de setores — opção B | **2/2 aprovados** | `feature-test-results.txt` |
| Suíte web ativa completa | **229/253 arquivos; 1.158/1.370 testes aprovados** | `web-full-summary.json` |
| Suíte do banco | **10/12 arquivos; 11/14 testes aprovados** | `database-vitest.json` |
| Build | **Não certificado** | `build.log` |

## Testes aprovados das funcionalidades críticas

Os testes diretamente relacionados ao fluxo de Primeiro Acesso passaram integralmente: `primeiro-acesso-functional.test.ts` teve 5 de 5 testes aprovados e `primeiro-acesso-ui.test.ts` teve 3 de 3. Isso valida o contrato funcional testado para troca de senha e a apresentação de feedback na interface, mas ainda não substitui um teste manual contra PostgreSQL de produção.

A regressão de Bônus PF passou integralmente, com 9 de 9 testes. Também passaram os testes do modal de Novo Consultor PF, CRUD de ciclos, aba de pontos, cálculos de configuração, ranking, resgate e escopo de setores. Esses resultados são reais e foram executados contra o código atual, não apenas por inspeção estática.

## Suíte web completa

A execução ativa completa foi feita sem executar o antigo bootstrap de reset. Foram processados 253 arquivos e 1.370 testes. Houve 229 arquivos aprovados e 1.158 testes aprovados.

Os 128 testes classificados como falha de infraestrutura foram interrompidos por `P1001: Can't reach database server at localhost:5432`. As falhas ocorreram em testes que criam dados reais com Prisma, incluindo distribuição de pontos, ranking, Consultor PF, metas, regras, setores e persistência. Portanto, esses testes **não provaram uma regressão funcional**; eles não conseguiram iniciar por falta do PostgreSQL.

Sete arquivos adicionais foram marcados como falhos pelo runner sem assertion falha isolável, com testes internos marcados como `skipped` durante o setup. Eles devem ser reexecutados com o banco ativo antes de qualquer declaração de aprovação total.

## Suíte do banco

A suíte do pacote de banco registrou 10 arquivos aprovados e 2 arquivos falhos, com 11 testes aprovados e 3 falhos. Os 3 falhos pertencem ao `schema-drift.test.ts` e também são falhas de infraestrutura: o cliente Prisma não conseguiu conectar a `localhost:5432`.

O teste anti-reset passou integralmente. A execução confirmou que `migrate reset`, `db push` e `migrate dev` continuam bloqueados e que apenas `asa_db` e `asa_db_test` são aceitos pelo guardião local.

## Build

O build executou com sucesso nas etapas de geração do Prisma Client, compilação TypeScript do banco e compilação do Next.js. Durante a geração estática, o Next.js registrou a mensagem de uso dinâmico para `/api/v1/admin/usuarios`, relacionada ao uso de `headers`. O processo não chegou a produzir um código final confiável dentro do tempo disponível e foi interrompido para evitar processo preso.

Assim, o build deve ser considerado **não certificado**, apesar de a compilação e a verificação de tipos terem passado até a fase de geração estática.

## Comandos para concluir a aprovação no Windows

Com PostgreSQL 17 ativo e `asa_db_test` disponível, executar na raiz `C:\apps\mundoas`:

```powershell
$env:PGPASSWORD = '123456'
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h localhost -p 5432 -U postgres -d postgres -c "SELECT current_database(), version();"
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'asa_db_test';"
Remove-Item Env:PGPASSWORD

pnpm db:safety-check
pnpm db:migrate:status
pnpm --filter @asa/database exec vitest run --reporter=dot
pnpm --filter @asa/web test
pnpm build
```

O `pretest` agora deve executar somente `migrate deploy`, nunca `migrate reset`. Se qualquer comando tentar resetar ou formatar o banco, a execução deve ser interrompida e o log deve ser preservado para investigação.

## Conclusão de aprovação

**Aprovado:** proteção do banco, testes de Bônus PF, Primeiro Acesso, Novo Consultor PF, ciclos, pontos, ranking/resgate e escopo de setores conforme os testes focados aprovados.

**Ainda não aprovado como 100%:** testes que exigem PostgreSQL ativo, schema-drift contra `asa_db_test`, testes de persistência/integração e build completo até o encerramento normal. A causa observada foi ambiental (`localhost:5432` indisponível e geração estática prolongada), não uma alteração automática ou reset de dados.
