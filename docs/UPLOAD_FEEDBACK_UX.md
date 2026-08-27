# Feedback do upload de produção

O upload de planilha agora apresenta um popup acessível para todos os resultados: sucesso, sucesso parcial, duplicidade, zero produções novas, erro de validação, erro de processamento e falha de comunicação.

Quando todas as linhas já existirem, a mensagem informa explicitamente que nenhuma nova produção foi salva porque os registros já estavam no banco. A produção existente é preservada; o processamento não apaga registros anteriores.

O backend grava `duplicated_rows` em `uploads_planilha_backoffice` e retorna o contador tanto na resposta síncrona quanto no endpoint de polling. A chave de duplicidade segue a constraint de `procedimentos_pf`: data de referência, CPF, procedimento e unidade.

Validação realizada: 4 arquivos e 69 testes de contrato/preview aprovados; `prisma validate`, `prisma generate` e `tsc --noEmit` aprovados. A validação de banco real depende de PostgreSQL ativo no ambiente de execução.
