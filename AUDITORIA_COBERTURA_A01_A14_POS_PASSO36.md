# Auditoria de cobertura do Relatório Técnico — A-01 a A-14

**Projeto:** `bkpmundoas`  
**Base avaliada:** relatório original, status histórico, Passos 1–36 e logs fornecidos pelo usuário  
**Data da revisão:** 21 de agosto de 2026  
**Conclusão executiva:** **o relatório não está 100% implementado**.

## 1. Conclusão executiva

A execução avançou significativamente. Os principais defeitos funcionais de produção PF, autorização por variável global, filtragem de comissões PF, agregação de produção, contrato do relatório, escopo de setores, formato de mês, revalidação de sessão, N+1 e vários bloqueios de lint receberam correções incrementais. Os logs apresentados confirmam sucessos relevantes: 54 testes de escopo, 51 de metas, 28 de autenticação/estado, 59 de upload e persistência, 112 de pontos, 65 de cadastro e 64 de comissões/ciclos, além de lint limpo nos lotes específicos.

Apesar disso, não é tecnicamente correto declarar conformidade integral com os 14 achados. O A-08 foi tratado apenas como mitigação; A-04, A-05, A-10, A-11, A-12, A-13 e A-14 ainda possuem partes estruturais pendentes. Além disso, o lint global ainda não foi demonstrado como limpo e o gate de release ainda precisa completar typecheck, suíte definida, build e smoke tests em conjunto.

> **Veredito:** o sistema está em condição muito mais madura para validação, mas a auditoria original permanece **parcialmente encerrada**, não integralmente encerrada.

## 2. Matriz consolidada de cobertura

| ID | Situação após os Passos 1–36 | Grau de cobertura | Evidência principal | Pendência que impede 100% |
|---|---|---:|---|---|
| A-01 | Corrigido tecnicamente | Alto | Passo 5 substituiu o stub da produção PF por consulta, agregação e resumo; testes de persistência/upload passaram | Falta teste direto da rota com produção real, meta e projeção verificáveis no mesmo cenário |
| A-02 | Corrigido | Alto | Passo 1 removeu a dependência de `global.__TEST_LIDERANCA_ID__` das rotas individuais | Recomenda-se um teste explícito de IDOR entre duas lideranças |
| A-03 | Corrigido | Alto | Passo 1 alinhou a consulta de comissão PF à entidade/campo de consultor PF | Falta teste direto específico do endpoint de backoffice com filtro de consultor PF |
| A-04 | Parcialmente corrigido | Médio | Passo 6 passou a tratar meta por consultor, setor e mês, com validação de escopo; 51 testes passaram | A tela ainda não demonstra seleção completa de setor na grade; falta cobertura explícita multi-setor e `criadoPorId`/invariantes associados |
| A-05 | Parcialmente corrigido | Médio | Passos 16–17 mapearam os seis tipos de procedimento e eliminaram comissão PF zerada; 8 testes unitários passaram | `dataReferencia` não seleciona regra versionada, não há snapshot da taxa aplicada e a regra por setor ainda não é modelada formalmente |
| A-06 | Corrigido na agregação, com cobertura funcional incompleta | Médio/alto | Passo 7 trocou a base de comparação para `valor_total`; os relatórios foram alinhados posteriormente | Falta teste direto do endpoint e representação explícita de procedimento sem comissão calculada |
| A-07 | Corrigido no contrato conhecido | Alto | Passo 18 alinhou DTO entre API e frontend; testes de componentes/relatórios passaram | Falta schema compartilhado ou teste de contrato diretamente contra a resposta HTTP da API |
| A-08 | Mitigação בלבד | Baixo/médio | Passo 19 removeu senha do JSON e DOM; mensagem de sucesso não exibe credencial | A senha continua previsível e necessária no fluxo atual; não existe convite/token de uso único nem redefinição segura sem senha em texto puro |
| A-09 | Corrigido no cadastro/upload | Alto | Passo 20 filtrou setores por `backofficeId` e rejeitou liderança sem escopo; 54 testes focados passaram | Recomenda-se teste de integração dedicado com dois backoffices e mesmo nome de setor em ambos |
| A-10 | Parcialmente corrigido | Médio | Backend passou a usar escopo da unidade; cadastro/upload ficaram mais restritos | Frontend ainda não foi comprovadamente convertido para lista dinâmica de setores da unidade; listas fixas e contrato frontend/backend precisam ser eliminados |
| A-11 | Parcialmente corrigido | Médio | Passo 21 bloqueou sobreposição de ciclos; Passo 22 validou `YYYY-MM` e mês 01–12 | Não há constraint/check no banco para formato de mês; defaults UUID sentinela, unicidade temporal de configurações/ciclos e idempotência de `ProcedimentoPF` continuam pendentes |
| A-12 | Parcialmente corrigido | Médio | Passo 23 revalidou status atual no helper de API; 28 testes passaram; lint do lote de ciclos/comissões passou | `auth-config.ts`/middleware ainda podem carregar sessão leve antiga; não há evidência de invalidação global imediata nem cobertura completa de todos os papéis/status |
| A-13 | Corrigido o N+1 principal, com pendência operacional | Médio/alto | Passo 24 substituiu chamadas por consultor por uma leitura agregada; 59 testes de metas/relatórios passaram | Atualização por `onBlur` ainda pode falhar sem estado “não salvo”; falta seleção explícita de ano/setor e teste de contagem de requisições |
| A-14 | Parcialmente mitigado | Médio | Passos 25–26 criaram gate de release e removeram `.env.test` do índice Git; lotes específicos de lint e testes passaram | O lint global ainda tinha erros fora dos lotes; não foi demonstrado gate completo com diff limpo, typecheck, testes, build e smoke tests após todos os passos |

## 3. Classificação objetiva

| Classificação | Achados |
|---|---|
| Corrigidos tecnicamente, sem pendência funcional principal comprovada | A-02, A-03, A-09 |
| Corrigidos no núcleo, mas ainda exigem teste direto/contrato | A-01, A-06, A-07 |
| Parcialmente implementados | A-04, A-05, A-10, A-11, A-12, A-13, A-14 |
| Apenas mitigado | A-08 |

Essa classificação significa que **3 de 14** achados podem ser considerados corrigidos com alta confiança pelo histórico disponível; outros **3** têm o núcleo corrigido, mas carecem de confirmação direta; **7** permanecem parciais; e **1** é somente mitigação. Portanto, a cobertura funcional é substancial, mas não equivale a 100% de implementação.

## 4. Evidências dos logs mais recentes

O log do Passo 36 confirma `No ESLint warnings or errors` nos dois arquivos alterados e **64 testes aprovados**. O Passo 34 confirmou lint limpo na tela de upload e **67 testes aprovados**. O Passo 32 confirmou lint limpo nos formulários de consultor/comercial e **65 testes aprovados**. O Passo 31 confirmou **112 testes aprovados** nos componentes de pontos, embora o lint daquele lote ainda tivesse somente avisos. O Passo 30 confirmou lint limpo nos três arquivos de relatório. Esses resultados validam os lotes incrementais, mas não substituem um gate global posterior.

O gate A-14 também revelou que `.env.test` estava versionado. O Passo 26 forneceu uma rotina para removê-lo do índice Git sem apagar a cópia local. Essa ação corrige o estado futuro do repositório, mas não remove segredos eventualmente presentes no histórico remoto; credenciais reais devem ser rotacionadas se o arquivo já tiver sido publicado.

## 5. O que ainda falta para declarar 100%

### A-08 — solução estrutural de credenciais

É necessário substituir a senha derivada do CPF por convite ou token aleatório, de uso único, com expiração e obrigatoriedade de troca. O endpoint de cadastro deve retornar apenas um identificador operacional seguro ou instrução de entrega fora da API, nunca a senha em texto puro.

### A-04/A-05/A-10 — granularidade e regra financeira

A tela e as APIs precisam tratar setor como dimensão de primeira classe. O cálculo financeiro deve identificar a regra vigente na competência, armazenar a taxa aplicada ou uma versão da política e permitir auditoria do resultado. O frontend deve obter setores do backoffice por API, em vez de depender de lista fixa.

### A-11 — invariantes no banco

As validações de aplicação são úteis, mas não equivalem a invariantes de banco. Ainda deve ser avaliada migration para eliminar defaults UUID sentinela, aplicar constraints/checks adequados, controlar sobreposição de configurações/ciclos e definir uma chave de idempotência/versionamento para procedimentos importados.

### A-12 — sessão e status

É necessário decidir se a sessão deve conter todos os campos usados na autorização ou se a autorização será sempre revalidada no servidor. Depois, deve haver teste por papel para usuário inativo, liderança inativa, consultor inativo e mudança de backoffice após emissão do token.

### A-13 — salvamento de metas

Além de eliminar o N+1, a tela deve indicar alterações pendentes, sucesso/erro por competência e recuperação após falha de rede. A consulta agregada deve explicitar ano e, quando aplicável, setor.

### A-14 — gate final

O release só deve ser aprovado após uma execução no projeto local que termine com sucesso em todos os itens: remoção de arquivos de ambiente versionados, `git diff --check`, instalação congelada, typecheck, lint global, testes focados, build e smoke tests das rotas financeiras críticas.

## 6. Comandos recomendados para a confirmação final

```powershell
Set-Location C:\apps\mundoas

pnpm install --frozen-lockfile
pnpm --filter @asa/database exec prisma migrate status
pnpm --filter web exec tsc --noEmit
pnpm lint
pnpm build
```

Os testes de integração e smoke tests devem ser executados conforme os nomes realmente presentes no workspace, evitando presumir arquivos que não existem. Antes disso, a lista pode ser obtida com:

```powershell
Get-ChildItem -Path .\apps\web -Recurse -File -Include '*.test.ts','*.test.tsx' |
  Select-Object -ExpandProperty FullName
```

## 7. Veredito final

**Não: 100% do relatório ainda não está implementado.** O núcleo dos principais defeitos foi corrigido e a evolução é consistente, mas há pendências materiais em segurança de primeiro acesso, versionamento de regras financeiras, invariantes de banco, sincronização dinâmica de setores, robustez de sessão, experiência de salvamento de metas e validação global de release.

A recomendação é registrar o estado atual como **“correções P0 principais implementadas; auditoria A-01–A-14 parcialmente encerrada”**. A liberação integral deve aguardar, no mínimo, o fechamento estrutural do A-08 e a execução bem-sucedida do gate global A-14.

## Referências

[1]: ./RELATORIO_AUDITORIA_BKPMUNDOAS.md "Relatório de Auditoria Técnica — Consultores, Lideranças, Produção e Comissões"
[2]: ./STATUS_AUDITORIA_BKPMUNDOAS.md "Status histórico da Auditoria Técnica"
[3]: ./step-19 "Artefatos do Passo 19 — mitigação A-08"
[4]: ./step-20 "Artefatos do Passo 20 — isolamento de setores"
[5]: ./step-21 "Artefatos do Passo 21 — sobreposição de ciclos"
[6]: ./step-22 "Artefatos do Passo 22 — formato de mês"
[7]: ./step-23 "Artefatos do Passo 23 — revalidação de sessão"
[8]: ./step-24 "Artefatos do Passo 24 — correção N+1"
[9]: ./step-25 "Artefatos do Passo 25 — gate de release"
[10]: ./step-26 "Artefatos do Passo 26 — remoção de ambiente versionado"
[11]: ./step-27 "Artefatos do Passo 27 — lint de consultores/metas/comissões"
[12]: ./step-36 "Artefatos do Passo 36 — lint de comissões/ciclos"
[13]: /home/ubuntu/upload/pasted_content_26.txt "Log do usuário — aplicação e validação do Passo 36"
