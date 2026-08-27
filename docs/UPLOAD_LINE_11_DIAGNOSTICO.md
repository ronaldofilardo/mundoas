# Diagnóstico da linha 11 do upload

A linha informada aparece como `VALIDO` porque o CPF foi associado a um Parceiro e os campos obrigatórios da produção foram aprovados. O indicador `Consultor PF ✗` não era uma rejeição: o vínculo com Consultor PF é opcional para a gravação da produção e a linha pode ser persistida com `consultorPfId = null`.

O problema de não subir sem explicação ocorria porque o preview não verificava a chave única da produção antes do envio. A persistência, por sua vez, identificava a mesma produção já existente e a ignorava para preservar dados. Assim, o preview continuava mostrando `VALIDO`, embora o processamento final pudesse contar a linha como duplicada.

A chave usada agora é:

```text
Data de referência + CPF normalizado + Procedimento + Unidade
```

A consulta é limitada ao Backoffice atual e é somente de leitura. Quando a chave já existe, a linha passa a aparecer como `DUPLICADA`, o contador de duplicidades é incrementado e um popup informa o motivo antes da confirmação do upload. Nenhuma produção existente é apagada.

Quando a linha é válida, mas o nome de Usuário da conta não corresponde a um Consultor PF ativo, o indicador passa a ser um aviso âmbar (`!`) e a interface informa que a produção será importada sem vínculo PF. Isso não bloqueia a importação.

Para confirmar a situação no banco local, pode-se consultar:

```sql
SELECT
  p.id,
  p.data_referencia,
  p.cpf,
  p.procedimento,
  p.unidade,
  p.consultor_pf_id,
  p.upload_id
FROM procedimentos_pf p
JOIN uploads_planilha_backoffice u ON u.id = p.upload_id
WHERE u.backoffice_id = '<BACKOFFICE_ID>'
  AND p.data_referencia = DATE '2026-07-06'
  AND regexp_replace(p.cpf, '\\D', '', 'g') = '03075398810'
  AND p.unidade = 'Acesso Saúde Colombo';
```

Se houver uma linha correspondente, o preview deve informá-la como duplicada. Se não houver, ela deve permanecer como válida e ser gravada, ainda que sem vínculo com Consultor PF.

## Validação executada

Foram aprovados 2 arquivos e 11 testes focados, incluindo os 3 testes novos de duplicidade e vínculo PF. A checagem TypeScript do app web terminou com código 0. Nenhum banco foi resetado ou modificado durante a validação.
