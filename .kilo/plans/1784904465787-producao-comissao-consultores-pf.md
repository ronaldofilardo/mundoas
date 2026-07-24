# Plano: Relatório de Produção/Comissão — Consultores PF (Backoffice e Liderança)

## Objetivo
Permitir que **backoffice** e **liderança** acompanhem mensalmente a produção e comissão dos consultores PF, lado a lado, com filtros e totais agregados.

---

## 1. Backoffice — Aba "Consultores PF" em `/backoffice/comissionamento/relatorios`

### 1.1 Correção de bug existente
- **Arquivo:** `apps/web/app/(dashboard)/backoffice/comissionamento/relatorios/hooks/use-relatorio-comissoes.ts`
- **Problema:** frontend chama `/api/v1/backoffice/relatorios/comissoes` (plural), mas o API real é `/api/v1/backoffice/relatorio-comissoes` (singular).
- **Ação:** corrigir a URL na chamada `fetch`.

### 1.2 Extender API `/api/v1/backoffice/relatorio-comissoes`
- **Arquivo:** `apps/web/app/api/v1/backoffice/relatorio-comissoes/route.ts`
- **Ação:** adicionar query param `tipo` (`comercial` | `consultor-pf`).
  - Quando `tipo=consultor-pf`: consultar `ComissaoConsultorPf` ao invés de `ComissaoComercial`.
  - Agrupar por mês e retornar `resumo.porMes`, `resumo.totalGeral` no mesmo formato.
  - Incluir `consultorPf: { select: { id, nome, cpf } }` no retorno.
  - Manter comportamento atual quando `tipo=comercial` ou ausente.

### 1.3 Atualizar UI da página de relatórios
- **Arquivo:** `apps/web/app/(dashboard)/backoffice/comissionamento/relatorios/page.tsx`
- **Ação:** adicionar tabs "Comerciais" | "Consultores PF".
  - Estado `tipoRelatorio` controla qual conjunto de dados exibir.
  - Reutilizar `FiltrosRelatorio` (adaptar para não mostrar `funcao` quando for consultor-pf, pois `ConsultorPf` não tem `funcao`).
  - Tabela de comissões detalhadas deve mostrar coluna "Consultor PF" + "CPF" quando `tipo=consultor-pf`.
  - Resumo por função deve ser ocultado para `consultor-pf` (não se aplica).
  - Manter exportação CSV funcionando para ambos os tipos.

### 1.4 Sidebar (já existe)
- Não precisa alterar sidebar: o item "Comissionamento > Relatórios" já existe e continuará servindo ambos os tipos via tab.

---

## 2. Liderança — Nova página `/lideranca/consultores-pf/producao`

### 2.1 Novo API endpoint
- **Arquivo:** `apps/web/app/api/v1/lideranca/consultores-pf/producao/route.ts` (novo)
- **Ação:** GET retorna produção e comissão mensal agregada dos consultores PF da equipe do líder.
  - Auth: `requireLiderancaWithScope()` para obter `liderancaId`.
  - Query params: `inicio` (YYYY-MM), `fim` (YYYY-MM).
  - Buscar `ComissaoConsultorPf` + `MetaConsultorPf` onde `consultorPf.liderancaId = liderancaId`.
  - Retornar array de registros com: `mesReferencia`, `consultorPfId`, `consultorPfNome`, `consultorPfCpf`, `valorProducao`, `valorComissao`, `valorMeta`, `valorAtingido`, `status`, `dataPagamento`.
  - Incluir `resumo.totalGeral` com totais da equipe.

### 2.2 Nova página frontend
- **Arquivo:** `apps/web/app/(dashboard)/lideranca/consultores-pf/producao/page.tsx` (novo)
- **Ação:** página client com:
  - Filtros: mês inicial, mês final.
  - Cards de resumo: Total Produção, Total Comissão, Qtd Consultores, Qtd Meses.
  - Tabela: Mês | Consultor PF | CPF | Meta | Produção | Comissão | Status | Pagamento.
  - Agrupamento visual por mês (separador/section) ou ordenado por mês desc + nome.
  - Estados: loading, vazio, erro.

### 2.3 Atualizar sidebar da liderança
- **Arquivo:** `apps/web/components/sidebar.tsx`
- **Ação:** adicionar item "Produção" na `liderancaNav`:
  ```ts
  { label: "Produção", href: "/lideranca/consultores-pf/producao", icon: "📋" }
  ```

---

## 3. Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---|---|---|
| Backoffice: endpoint separado ou extendido? | **Extender** `/api/v1/backoffice/relatorio-comissoes` com `tipo` | Evita duplicação de lógica de agrupamento; URL já parcialmente existente no frontend. |
| Liderança: endpoint próprio ou reutilizar backoffice? | **Endpoint próprio** `/api/v1/lideranca/consultores-pf/producao` | Escopo diferente (apenas equipe do líder), auth diferente, filtros específicos de liderança. |
| Formato de agregação | **Mensal por consultor** (`YYYY-MM`) | Alinha-se com `ComissaoConsultorPf` e `MetaConsultorPf` que já usam `mesReferencia`. |
| Incluir `MetaConsultorPf` na resposta? | **Sim** (`valorMeta`, `valorAtingido`) | Acompanhamento mensal do líder inclui meta vs produção. |

---

## 4. Ordem de implementação sugerida

1. Corrigir bug da URL no hook `use-relatorio-comissoes.ts`.
2. Estender API `/api/v1/backoffice/relatorio-comissoes` com `tipo=consultor-pf`.
3. Adicionar tabs na página `backoffice/comissionamento/relatorios/page.tsx`.
4. Criar API `/api/v1/lideranca/consultores-pf/producao/route.ts`.
5. Criar página `/lideranca/consultores-pf/producao/page.tsx`.
6. Atualizar `sidebar.tsx` para incluir link de produção da liderança.

---

## 5. Riscos e validação

- **Risco:** O hook do backoffice pode estar quebrado atualmente devido ao bug de URL. Validação: testar aba Comerciais após correção.
- **Risco:** Performance ao trazer todos os `ComissaoConsultorPf` sem paginação. Para relatório, aceitável; se necessário, adicionar `take`/`skip` ou limitar a 24 meses.
- **Validação:**
  - Backoffice: trocar tab, filtrar por mês, verificar totais, exportar CSV em ambos os tipos.
  - Liderança: filtrar por período, verificar cards de resumo, checar agrupamento por mês e consultor.
