# Unidade na Lista de Produção e valor monetário do ranking

## Lista de Produção

A coluna `Unidade` agora aplica `normalizarNomeUnidade` somente na camada visual. O prefixo institucional `Acesso Saúde` é removido quando existir:

```text
Acesso Saúde Curitiba -> Curitiba
Acesso Saúde Colombo  -> Colombo
Curitiba               -> Curitiba
```

O valor salvo no banco, o filtro de busca e o contrato da API permanecem inalterados.

## Indicação > Ranking

A coluna antes rotulada `Produção (R$)` usava o total de produção/comissão e não representava o valor da pontuação. Ela foi substituída por `Valor dos pontos (R$)`.

Para cada posição, a API seleciona a configuração vigente do Backoffice e calcula:

```text
valorPontos = pontosAcumulados × valorPorPonto
```

A chave do cache inclui a configuração vigente, evitando manter valor monetário antigo após alteração de R$ por ponto.

Sem configuração vigente, o contrato retorna valor por ponto zero, permitindo que a UI permaneça estável até o Backoffice cadastrar a configuração.

## Validação

O teste `apps/web/app/__tests__/lista-producao-ranking-valor.test.ts` cobre a normalização da unidade, o cálculo de 125 pontos a R$ 0,50 e a presença dos campos/labels no contrato de ranking. A execução terminou com 1 arquivo e 4 testes aprovados. A checagem TypeScript do app web terminou com código 0.
