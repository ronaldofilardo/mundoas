# Janela de resgate no perfil Parceiro

O perfil Parceiro segue a mesma regra de ciclo: a janela de resgate começa no primeiro dia de `inicioAcumuloEm` e termina em `fimResgateEm`. A disponibilidade não fica condicionada ao fim do acúmulo.

As APIs de catálogo e solicitação aceitam ciclos `EM_ANDAMENTO` ou `RESGATE_ABERTO` quando a data atual está entre `inicioResgateEm` e `fimResgateEm`. A carteira exibe a janela desde o início do ciclo e o catálogo habilita o botão de solicitação durante esse período.

Validação executada: 5 arquivos passaram e 10 testes passaram; 6 testes de integração foram pulados/interrompidos porque o PostgreSQL em `localhost:5432` não estava acessível. O `tsc --noEmit` do app web passou.
