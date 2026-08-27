# Prazo de entrega dos prêmios de Indicação

## Regra de negócio

Cada prêmio possui um `prazoEntregaDias`, em dias corridos, informado pelo Backoffice. O prazo começa a contar no instante em que a solicitação de resgate passa para o status `APROVADO`.

A data limite é calculada como:

```text
data limite = processadoEm + prazoEntregaDias
```

O valor é copiado para `solicitacoes_resgate.prazo_entrega_dias` no momento da solicitação. Esse snapshot evita que a edição posterior do cadastro do prêmio altere o prazo de um resgate já realizado.

Enquanto o resgate não estiver aprovado, a fila exibe `Após aprovação`. Para resgates aprovados ou entregues, a fila exibe a data limite calculada.

## Alterações técnicas

A tabela `premios` recebeu `prazo_entrega_dias INTEGER NOT NULL DEFAULT 0`. A tabela `solicitacoes_resgate` recebeu o mesmo campo para preservar o prazo histórico de cada solicitação. Ambos possuem check de não negatividade.

O formulário de `/backoffice/pontos > Indicação > Prêmios` foi reorganizado no padrão visual de Pontos, com quatro campos na primeira linha: Código, Tipo, Custo em Pontos e Prazo de entrega. A descrição e o botão de cadastro ficam na linha seguinte em telas largas.

As APIs de cadastro e edição validam o prazo como inteiro maior ou igual a zero. As APIs de resgate do parceiro e do Consultor PF copiam o prazo do prêmio para a solicitação. A API da fila de resgates retorna `prazoEntregaDias` e `prazoEntregaAte`.

## Aplicação

A migration é incremental e não utiliza `db push`, reset ou drop. Em desenvolvimento, deve ser aplicada com o wrapper seguro já existente. Após validação, a mesma migration deve ser aplicada no Neon por `prisma migrate deploy`, nunca por formatação automática do banco.

## Validação

Foram aprovados quatro arquivos de teste, totalizando 63 testes, além da checagem TypeScript do app web. A suíte cobre layout, validação e persistência do prazo, snapshot no resgate, cálculo da data limite e migration não destrutiva.
