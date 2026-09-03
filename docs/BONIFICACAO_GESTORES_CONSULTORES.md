# Plano: Tela de Bonificação por Gestor/Consultor

## Contexto

Atualmente o menu **Equipe > Bonificação** (`/backoffice/equipe/bonus`) redireciona para o componente `BonusConsultorPf`, que exibe:
- Ciclos de Bônus PF
- Formulário de criação/edição de ciclos
- Reset administrativo de pontos

O que falta: a listagem de **gestores** e seus **consultores** com os **bônus de cada consultor**.

## Objetivo

Criar uma view em `/backoffice/equipe/bonus` que:
- Liste todos os **gestores** do backoffice
- Para cada gestor, mostre seus **consultores** e o **bônus acumulado** de cada um
- Permita filtrar por ciclo de bônus, período ou gestor
- Ofereça ações administrativas (reset, detalhamento)

## Modelo de dados disponível

- `Equipe` — tabela unificada com `tipo` (`GESTOR`, `COMERCIAL`, `LIDERANCA`, `CONSULTOR_PF`)
- `ConsultorPf` — vincula-se a `Equipe` via `equipeId`
- `CicloPontos` — ciclos de pontos/bônus, com `publico: "CONSULTOR_PF"`
- `MovimentacaoPontos` — créditos/débitos de pontos por consultor PF
- `ConfiguracaoBonus` — regra de conversão produção→pontos
- `ProcedimentoPF` — produção dos consultores PF

## Proposta de UI

### Estrutura
```
/backoffice/equipe/bonus
├── Filtros globais
│   ├── Ciclo de bônus (select)
│   ├── Gestor (select)
│   └── Período (date range)
├── Cards de resumo por gestor
│   ├── Nome do gestor
│   ├── Qtd. consultores
│   ├── Total de pontos distribuídos
│   └── Total de resgates no período
└── Tabela/Lista de consultores por gestor
    ├── Nome
    ├── CPF
    ├── Pontos acumulados no ciclo
    ├── Última produção
    ├── Status do ciclo
    └── Ações (ver extrato, reset)
```

### Comportamento
- **Ciclo padrão**: ciclo de bônus vigente (`EM_ANDAMENTO` ou `RESGATE_ABERTO`)
- **Fallback**: se não houver ciclo vigente, exibir o ciclo mais recente ou vazio
- **Permissão**: `requireBackofficeWithScope()`
- **Cache**: manter `itens` e `pontosPorConsultor` em estado local; recarregar ao mudar filtros

## Endpoints necessários

### 1. Listagem agregada por gestor/consultor
**Novo arquivo:** `apps/web/app/api/v1/backoffice/equipe/bonus/route.ts`

**GET** `/api/v1/backoffice/equipe/bonus`
- Query params: `cicloId?`, `gestorId?`, `inicio?`, `fim?`
- Auth: `requireBackofficeWithScope()`
- Response:
  ```ts
  {
    gestores: [
      {
        id: string;
        nome: string;
        consultores: [
          {
            id: string;
            nome: string;
            cpf: string;
            saldoPontos: number;
            totalResgates: number;
            ultimaProducao: string | null;
          }
        ]
      }
    ],
    resumo: {
      totalGestores: number;
      totalConsultores: number;
      totalPontosDistribuidos: number;
    }
  }
  ```

### 2. Extrato de pontos por consultor
**Novo arquivo:** `apps/web/app/api/v1/backoffice/equipe/bonus/[consultorPfId]/extrato/route.ts`

**GET** `/api/v1/backoffice/equipe/bonus/[consultorPfId]/extrato`
- Query params: `cicloId?`, `inicio?`, `fim?`
- Response:
  ```ts
  {
    consultor: { id: string; nome: string; cpf: string };
    movimentacoes: [
      {
        id: string;
        tipo: "CREDITO" | "DEBITO";
        quantidade: number;
        origem: string;
        descricao: string;
        criadoEm: string;
      }
    ];
    saldoAtual: number;
  }
  ```

## Componentes frontend

### Página
**Arquivo:** `apps/web/app/(dashboard)/backoffice/equipe/bonus/page.tsx`
- Manter wrapper existente
- Substituir `BonusConsultorPf` por novo componente `BonificacaoGestoresConsultores`

### Componente principal
**Novo arquivo:** `apps/web/app/(dashboard)/backoffice/equipe/bonus/components/bonificacao-gestores-consultores.tsx`

Responsabilidades:
- Carregar lista de gestores e consultores
- Aplicar filtros
- Renderizar cards de resumo por gestor
- Renderizar tabela de consultores
- Integrar com API de extrato para detalhamento

### Modal de extrato
**Novo arquivo:** `apps/web/app/(dashboard)/backoffice/equipe/bonus/components/modal-extrato-bonus.tsx`

Responsabilidades:
- Exibir movimentações do consultor em tabela
- Mostrar saldo atual
- Permitir fechar modal

## Critérios de elegibilidade

- Consultor PF deve ter `equipe.lideranca.tipo === "GESTOR"` ou pertencer a uma equipe de gestor
- Apenas movimentações de `CicloPontos` com `publico: "CONSULTOR_PF"` e `backofficeId` do usuário logado
- Filtro padrão: ciclo vigente do backoffice

## Regras de cálculo

- **Saldo por consultor**: soma de `CREDITO` - soma de `DEBITO` em `MovimentacaoPontos`
- **Total por gestor**: soma dos saldos de seus consultores
- **Total geral**: soma de todos os saldos
- **Última produção**: `ProcedimentoPF` mais recente do consultor com `modalidadeContemplacao !== "BONUS_PONTOS"` ou data mais recente de importação

## Filtros

| Filtro | Tipo | Default | Observação |
|--------|------|---------|------------|
| Ciclo | select | Vigente | Carregar ciclos de `CicloPontos` onde `publico = "CONSULTOR_PF"` |
| Gestor | select | Todos | Listar gestores do backoffice |
| Período | date range | Mês atual | Aplicar em `MovimentacaoPontos.criadoEm` |

## Ações por linha

| Ação | Destino | Descrição |
|------|---------|-----------|
| Ver extrato | Modal | Lista movimentações do consultor no ciclo/período |
| Resetar pontos | Modal/API | Chamar `POST /api/v1/backoffice/pontos/bonus/reset` com `consultorPfId` |

## Considerações de performance

- Evitar N+1: carregar todos os gestores com `include` de `consultorPfs` e `movimentacoes` em query única
- Paginação não é esperada no primeiro momento (volume baixo de consultores PF por backoffice)
- Cache de ciclos e configuração de bônus pode ser reaproveitado de `BonusConsultorPf` se houver composição

## Dependências

- Reutilizar `useEquipe` para listagem de gestores
- Reutilizar endpoints de ciclos e configuração existentes
- Manter `BonusConsultorPf` disponível em `/backoffice/configuracoes/bonus` para gestão de ciclos e configuração

## Migração do estado atual

1. Manter `/backoffice/configuracoes/bonus` com `ConfiguracaoBonus` + `BonusConsultorPf`
2. Transformar `/backoffice/equipe/bonus` em `BonificacaoGestoresConsultores`
3. Atualizar sidebar label de "Bônus" para "Bonificação" (feito)
4. Atualizar testes de regressão que esperam `label: "Bônus"` no menu Equipe
