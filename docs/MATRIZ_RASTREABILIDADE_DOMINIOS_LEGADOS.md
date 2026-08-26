# Matriz de rastreabilidade dos domínios legados

## Escopo

Esta matriz registra a substituição dos domínios removidos **Estabelecimento, Cupons e Consultas** no MundoAS. Ela evita que nomes históricos sejam reintroduzidos como entidades, rotas ou fontes financeiras.

| Conceito legado | Estado atual | Fonte atual | Endpoint/interface atual | Decisão |
|---|---|---|---|---|
| Estabelecimento | Removido | Não existe no schema atual | Não existe rota runtime | Não reintroduzir como entidade; usar `backoffice`/`unidade` somente quando o contexto operacional exigir. |
| Usuário de estabelecimento | Removido | `usuarios` com perfis atuais | Autenticação centralizada | Preservar `usuarios`, `senhaTemporaria` e Primeiro Acesso. |
| Cupom/configuração de cupom | Removido | Não existe no schema atual | Uploads e produção atuais | Não criar equivalência fictícia; indicadores devem apontar para produção persistida. |
| Cupom importado | Removido | `procedimentos_pf`/produção persistida | Rotas de uploads e produção | Usar `valorTotal`, `dataReferencia`, `comercialId` e `consultorPfId`. |
| Consulta como entidade | Removido | Tipo de procedimento, quando aplicável | Rotas de produção/procedimentos | Não usar status ou FK de uma entidade `consulta` inexistente. |
| Comissão derivada de consulta/cupom | Substituído | Comissões e regras atuais | Rotas de comissão/projeção | Calcular a partir de produção persistida e regra vigente. |

## Regra de manutenção

Qualquer nova funcionalidade que receba os termos “estabelecimento”, “cupom” ou “consulta” deve primeiro identificar se o termo é apenas uma descrição operacional ou se está tentando reintroduzir um domínio removido. Novas tabelas, relações ou endpoints legados exigem decisão explícita de produto e revisão do schema.

## Verificação

Rotas runtime removidas devem ser verificadas com o inventário de `apps/web/app/api/v1`. Testes históricos podem permanecer em `legacy-tests`, mas não devem participar da suíte ativa sem contrato atualizado.

## Observação

A matriz não altera dados nem cria equivalências fictícias para relatórios históricos. Qualquer necessidade de consulta histórica deve ser tratada como requisito separado de migração ou exportação.

## Referências

A matriz é baseada no inventário técnico do projeto e deve ser atualizada junto com cada alteração de domínio ou migration estrutural.

[1]: ../audit/RELATORIO_AUDITORIA_CODIGO_E_CONTRATOS.md

## References

[1]: ../audit/RELATORIO_AUDITORIA_CODIGO_E_CONTRATOS.md
