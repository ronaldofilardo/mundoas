# Comparação de migrations — asa_db x Neon

## Escopo

A análise foi executada em modo somente leitura. Nenhum `migrate deploy`, `migrate dev`, `db push`, `reset`, `drop` ou alteração de dados foi executado.

## Resultado do Neon

A conexão com o Neon foi confirmada para o banco `neondb`, schema `public`. A tabela `_prisma_migrations` existe, porém possui **0 registros**.

Isso significa que o Prisma não possui no Neon um histórico confiável das migrations aplicadas. Portanto, não é possível concluir com segurança quais migrations do banco de desenvolvimento já foram executadas em produção apenas consultando o ledger do Prisma.

## Diff Neon x schema atual

O comando `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --script` produziu 99 linhas de diferença. Entre as diferenças relevantes estão:

| Área | Diferença detectada |
|---|---|
| Bônus PF | Enum `PublicoCicloPontos`, enum `ModalidadeContemplacao`, carteira de Consultor PF e estruturas de ranking PF precisam ser reconciliados. |
| Ciclos | `ciclos_pontos.publico` está ausente no Neon e `inicio_resgate_em` precisa ser obrigatório conforme o schema atual. |
| Produção PF | `procedimentos_pf.modalidade_contemplacao` está ausente no Neon. |
| Upload | `uploads_planilha_backoffice.duplicated_rows` está ausente no Neon. |
| Resgates e movimentações | `consultor_pf_id` e índices associados precisam ser reconciliados; nulabilidade de `parceiro_id` também diverge. |
| Ranking PF | As tabelas `ranking_snapshots_consultores_pf` e `ranking_posicoes_consultores_pf` estão ausentes. |
| Histórico legado | O diff sugere a remoção de `password_reset_tokens`; isso é potencialmente destrutivo e não deve ser executado automaticamente. |

## Evidência visual adicional do Neon

As imagens fornecidas confirmam que o Neon já possui uma parte importante do domínio atual, incluindo `ciclos_pontos`, `comissoes_consultor_pf`, `consultor_pf_setores`, `consultores_pf`, `movimentacoes_pontos`, `procedimentos_pf`, `ranking_posicoes`, `ranking_snapshots`, `regras_comerciais_itens`, `regras_gestores_itens`, `uploads_planilha_backoffice` e `usuarios`.

Há duas distinções importantes:

| Evidência | Interpretação |
|---|---|
| `ranking_posicoes` e `ranking_snapshots` existem | São as tabelas genéricas/legadas de ranking visualizadas; isso não comprova a existência das tabelas específicas `ranking_posicoes_consultores_pf` e `ranking_snapshots_consultores_pf` exigidas pelo schema atual. |
| `password_reset_tokens` existe | O Neon ainda possui a tabela que o schema atual sugere remover. Essa remoção não deve ser feita sem verificar dados e dependências. |
| Tabelas de Bônus PF já aparecem no Neon | A produção está parcialmente atualizada; o problema é de reconciliação de colunas, enums, índices, constraints e tabelas específicas, não simplesmente de criação de todas as tabelas. |

## Conclusão

**Sim, o Neon precisa receber alterações para ficar compatível com o schema atual do MundoAS.** Porém, não é seguro simplesmente executar `prisma migrate deploy` neste momento, porque o ledger `_prisma_migrations` está vazio enquanto o banco já contém estruturas. O Prisma pode interpretar todas as migrations do repositório como pendentes e tentar reaplicar operações sobre tabelas, enums, índices e constraints que já existem parcialmente.

A situação correta é tratar o Neon como um banco sem baseline de migrations: primeiro fazer um inventário estrutural e uma reconciliação controlada do histórico. A migration deve ser aplicada somente após confirmar o estado real das tabelas, colunas, enums, índices e constraints, além de decidir explicitamente sobre a remoção de `password_reset_tokens`.

## Execução realizada

Foi criado um backup lógico custom-format antes da alteração:

- arquivo: `backup/neon-before-reconciliation.dump`;
- cliente: PostgreSQL 18.6, compatível com o servidor Neon 18.6;
- SHA-256: `673702c693f53a79ab49f50081562400d56397c3174819a81e081b734e572c00`;
- tamanho: aproximadamente 150 KB.

Também foram verificadas as contagens críticas: `password_reset_tokens = 0`, `consultores_pf = 0`, `comissoes_consultor_pf = 0`, `solicitacoes_resgate = 0`, `procedimentos_pf = 24`, `ciclos_pontos = 2` e `usuarios = 7`.

A reconciliação estrutural idempotente foi executada no Neon com sucesso. As tabelas específicas de ranking PF foram criadas, as colunas/enums/índices/constraints do Bônus PF foram reconciliados e `password_reset_tokens` foi preservada.

## Recomendação operacional

O próximo passo é registrar o baseline no ledger `_prisma_migrations`. Isso ainda não foi executado a partir do sandbox porque o repositório local confirmado pelo usuário possui 75 migrations, enquanto a cópia de trabalho disponível para o agente possui uma árvore diferente. Registrar nomes a partir da árvore errada poderia criar um baseline inconsistente.

Use o script `registrar-baseline-neon.ps1` a partir da sua cópia `C:\apps\mundoas`; ele exige exatamente 75 diretórios de migration, usa somente `prisma migrate resolve --applied` e interrompe em qualquer divergência. Depois do baseline, migrations novas poderão ser aplicadas incrementalmente com `prisma migrate deploy`.

Não executar `db push`, reset, drop ou aplicar diretamente o SQL gerado pelo `migrate diff`. A remoção de `password_reset_tokens` permanece deliberadamente fora da reconciliação.

O usuário confirmou no ambiente local que o `asa_db` possui **75 migrations encontradas** e que o Prisma informou `Database schema is up to date!`. A lista enviada inclui, até o estado mais recente, as migrations de reset de origem, ranking PF, modalidade de contemplação, ciclos públicos, ownership do Consultor PF, início de resgate no primeiro dia e `duplicated_rows`.

O banco local `asa_db` não estava acessível diretamente neste sandbox; portanto, a confirmação do ledger local foi feita pela saída fornecida pelo usuário. O diff estrutural contra o schema do repositório e o histórico local confirmado são suficientes para concluir que o Neon precisa de reconciliação, mas não para aplicar cegamente todas as 75 migrations como se o banco de produção fosse vazio.
