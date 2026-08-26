# Contratos de produção e comissionamento

Este documento registra as invariantes que ligam upload, produção persistida, regras e comissões. Ele substitui a dependência histórica de cupons e consultas como entidades.

| Contrato | Invariante obrigatória |
|---|---|
| Upload/preview de produção | `valorTotal` ausente ou inválido deve ser rejeitado; zero só é aceito quando explicitamente informado e válido. |
| Persistência de produção | `dataReferencia`, `valorTotal`, backoffice e vínculo operacional devem permanecer rastreáveis. |
| Reprocessamento | Procedimentos, comissão e meta devem ser atualizados na mesma transação. |
| Reprocessamento repetido | Deve produzir o mesmo estado final, sem duplicar comissão ou meta. |
| Setores | Frontend exibe a regra vigente; backend autoriza e valida pelo escopo do backoffice. |
| Domínios removidos | Não publicar rotas de Estabelecimento, Cupons ou Consultas como entidades legadas. |

## Critérios de aceite

Uma alteração financeira somente deve ser considerada pronta quando houver teste para valor ausente, valor zero legítimo, reprocessamento repetido e falha intermediária na transação. O vínculo de produção sem comercial deve seguir a regra explicitamente definida pelo produto; até essa definição, o endpoint deve manter o comportamento existente documentado e não ampliar silenciosamente o escopo.

[1]: ../audit/RELATORIO_AUDITORIA_CODIGO_E_CONTRATOS.md

## References

[1]: ../audit/RELATORIO_AUDITORIA_CODIGO_E_CONTRATOS.md


## Política de exposição de setores — Opção B

O endpoint genérico `/api/v1/setores` retorna somente setores ativos cujo `backofficeId` corresponde ao usuário autenticado. A rota de setores do backoffice aplica a mesma restrição e não inclui registros globais com `backofficeId = null`.

As telas operacionais que dependem de regras continuam usando origens explícitas, como `origem=regras-consultores`. Quando um usuário autenticado não possui backoffice resolvível, a API responde com acesso negado em vez de listar setores globais.
