# Política de Refatoração - mundoas Monorepo

> **Versão:** 2.0
> **Vigência:** Setembro 2026
> **Revisão:** Trimestral

## Princípios Obrigatórios

### 0. Linha Base de Testes Obrigatória

**Nenhuma refatoração pode iniciar sem linha base de testes estabelecida.**

#### Requisito Mandatory

Antes de qualquer alteração:
- Executar a suíte de testes: `pnpm test`
- Validar cobertura mínima aceitável
- Se a cobertura for insuficiente, criar testes primeiro
- Documentar comportamento atual com testes

#### Se Não Houver Testes Suficientes

**PROIBIDO** iniciar refatoração sem testes cobrindo pelo menos:
- Fluxos principais do arquivo
- Casos de sucesso
- Casos de erro e edge cases
- Comportamento atual documentado

**Ação obrigatória:**
1. Criar testes de regressão primeiro
2. Garantir que todos os novos testes passem
3. Só então iniciar a refatoração

#### Cobertura Mínima por Tipo

| Tipo | Cobertura Mínima |
|------|------------------|
| API Route | 90% |
| Hook | 85% |
| Component | 80% |
| Page | 85% |
| Service | 90% |
| Utils | 90% |

#### Exemplo de Baseline

```bash
# Antes da refatoração
pnpm test

# Verificar cobertura
pnpm test --coverage

# Documentar resultados
- X testes passando
- Cobertura: X%
- Fluxos cobertos: lista
```

**Regra de ouro:** Se não conseguir provar que o código atual funciona, não pode refatorá-lo.

---

### 1. Tamanho Máximo de Arquivo: **< 200 linhas**

Nenhum arquivo `.ts` ou `.tsx` deve exceder **200 linhas**. Arquivos que atingirem ou ultrapassarem esse limite devem ser refatorados obrigatoriamente antes do merge.

### 2. Complexidade Ciclomática Máxima: **≤ 10 por arquivo**

A complexidade ciclomática de cada arquivo deve ser **≤ 10**. Arquivos que excederem esse valor devem ser decompostos em unidades menores antes do merge.

### 3. Condição Mandatory: Zero Quebras ou Regressões

**PREMISSA:** Sem linha base de testes, não há refatoração segura.

**ANTES de iniciar qualquer refatoração:**

1. ✅ **Linha Base de Testes (OBRIGATÓRIO):**
   - Executar `pnpm test` e confirmar todos os testes passando
   - Verificar cobertura com `pnpm test --coverage`
   - **Se cobertura insuficiente:** criar testes de regressão PRIMEIRO
   - Documentar: "Baseline: X testes, X% cobertura, fluxos cobertos: [lista]"

2. ✅ **Build Atual:** O build deve estar funcionando
   ```bash
   pnpm build
   ```

3. ✅ **Snapshot de Comportamento:** Documentar comportamento atual
   - Capturar inputs/outputs de funções principais
   - Screenshot de páginas (se aplicável)
   - Logs de API responses

4. ✅ **Versionamento:** Criar branch específica para refatoração
   ```bash
   git checkout -b refactor/nome-do-arquivo
   ```

**DURANTE a refatoração:**

- ✅ Manter assinatura de funções públicas (ou criar adapters)
- ✅ Não remover exports existentes (ou manter deprecated com warning)
- ✅ Preservar comportamento de edge cases
- ✅ Rodar testes diretos do arquivo frequentemente após cada extração
- ✅ Commits atômicos e reversíveis

**APÓS a refatoração:**

1. ✅ **Testes diretos do(s) arquivo(s) refatorado(s) passam:** testes específicos do(s) arquivo(s) modificado(s) devem estar 100% verde
2. ✅ **Build bem-sucedido:** `pnpm build` sem erros ou warnings críticos
3. ✅ **Cobertura mantida ou melhorada:** Não reduzir cobertura existente
4. ✅ **Teste manual crítico:** Validar fluxos principais afetados
5. ✅ **Code review:** Outro desenvolvedor deve revisar mudanças
6. ✅ **Rollback plan:** Ter plano de rollback testado se necessário

**Critério de Aceite:**
- ❌ Se teste direto do(s) arquivo(s) refatorado(s) falhar → REFAZER a refatoração
- ❌ Se build falhar → REFAZER a refatoração
- ❌ Se comportamento mudar → REFAZER a refatoração
- ❌ Se arquivo exceder 200 linhas → REFAZER a refatoração
- ❌ Se complexidade ciclomática > 10 → REFAZER a refatoração
- ❌ Se cobertura de testes diminuir → REFAZER a refatoração
- ✅ Somente prosseguir se 100% idêntico ao comportamento anterior E dentro dos limites

### 4. Arquivos Críticos Atuais (Prioridade de Refatoração)

| Arquivo | Linhas | Prioridade | Ação Necessária |
|---------|--------|------------|-----------------|
| `apps/web/app/(dashboard)/gestor-pf/configuracoes/comissoes-gestao/page.tsx` | 1271 | 🔴 CRÍTICA | Extrair hooks, componentes e utils |
| `apps/web/app/(dashboard)/gestor-pf/pontos/page.tsx` | 642 | 🔴 CRÍTICA | Extrair hooks e componentes |
| `apps/web/app/api/v1/gestor-pf/uploads/route.ts` | 563 | 🔴 CRÍTICA | Separar handlers e services |
| `apps/web/app/(dashboard)/gestor-pf/producao/relatorios/page.tsx` | 519 | 🔴 CRÍTICA | Extrair componentes de UI |
| `apps/web/app/(dashboard)/gestor/consultores/page.tsx` | 500 | 🔴 CRÍTICA | Limite ultrapassado - refatorar imediatamente |

---

## Princípios de Refatoração

### 1. Separação de Responsabilidades

#### Pages (Next.js)
```
❌ RUIM: Tudo na page.tsx
- Lógica de negócio
- Fetch de dados
- UI components
- Types inline

✅ BOM:
page.tsx
├── Componentes da página (extraídos)
├── Hooks customizados (useX.ts)
├── Types dedicados (types.ts)
└── Server actions (actions.ts)
```

#### API Routes
```
❌ RUIM: Tudo no route.ts
- Validação
- Regras de negócio
- Queries do banco
- Response formatting

✅ BOM:
route.ts (máx 100 linhas)
├── services/ (regras de negócio)
├── validators/ (schemas Zod)
├── responses/ (format helpers)
└── types/ (types específicos)
```

### 2. Estrutura de Pastas Recomendada

```
apps/web/
├── app/
│   ├── (dashboard)/
│   │   └── gestor-pf/
│   │       ├── configuracoes/
│   │       │   └── comissoes-gestao/
│   │       │       ├── page.tsx (máx 200 linhas)
│   │       │       ├── components/
│   │       │       │   ├── comerciais-list.tsx
│   │       │       │   ├── metas-form.tsx
│   │       │       │   ├── comissoes-table.tsx
│   │       │       │   └── regras-panel.tsx
│   │       │       ├── hooks/
│   │       │       │   ├── use-comerciais.ts
│   │       │       │   ├── use-metas.ts
│   │       │       │   └── use-comissoes.ts
│   │       │       ├── actions.ts
│   │       │       └── types.ts
│   │       │
│   │       └── pontos/
│   │           └── ... (mesma estrutura)
│   │
│   └── api/v1/
│       └── gestor-pf/
│           ├── uploads/
│           │   ├── route.ts (máx 100 linhas)
│           │   ├── service.ts (regras de negócio)
│           │   ├── parser.ts (planilha parsing)
│           │   ├── validator.ts (validações)
│           │   └── types.ts
│           │
│           └── ...
│
├── components/
│   ├── ui/ (componentes genéricos)
│   ├── gestor-pf/ (componentes específicos)
│   └── parceiro/
│
├── lib/
│   ├── api-helpers.ts (máx 300 linhas - dividir se crescer)
│   ├── pontos-utils.ts (máx 300 linhas)
│   ├── auth.ts (máx 300 linhas)
│   └── ...
│
└── hooks/ (hooks globais reutilizáveis)
```

### 3. Patterns de Extração

#### Extração de Hooks Customizados

**Antes (na page.tsx):**
```tsx
export default function Page() {
  const [comerciais, setComerciais] = useState([]);
  const [loading, setLoading] = useState(true);
  
  async function fetchComerciais() {
    setLoading(true);
    const res = await fetch("/api/v1/gestor-pf/comerciais");
    const data = await res.json();
    setComerciais(data);
    setLoading(false);
  }
  
  useEffect(() => {
    fetchComerciais();
  }, []);
  
  // ... mais 400 linhas
}
```

**Depois (hook dedicado):**
```tsx
// hooks/use-comerciais.ts
export function useComerciais() {
  const [comerciais, setComerciais] = useState<Comercial[]>([]);
  const [loading, setLoading] = useState(true);
  
  async function fetchComerciais() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gestor-pf/comerciais");
      const data = await res.json();
      setComerciais(data);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    fetchComerciais();
  }, []);
  
  return { comerciais, loading, refetch: fetchComerciais };
}
```

#### Extração de Componentes

**Antes:**
```tsx
export default function Page() {
  return (
    <div>
      <h1>Gestão de Comissões</h1>
      {/* 300 linhas de JSX inline */}
      <table>...</table>
      <form>...</form>
      <modal>...</modal>
    </div>
  );
}
```

**Depois:**
```tsx
export default function ComissoesGestaoPage() {
  return (
    <div>
      <h1>Gestão de Comissões</h1>
      <ComerciaisList />
      <MetasForm />
      <ComissoesTable />
      <RegrasPanel />
    </div>
  );
}
```

#### Extração de Services (API Routes)

**Antes:**
```tsx
// route.ts - 600 linhas
export async function POST(req: NextRequest) {
  // Validação inline
  // Regras de negócio inline
  // Queries do banco inline
  // Response formatting inline
}
```

**Depois:**
```tsx
// route.ts - 50-80 linhas
import { processUploadService } from "./service";
import { validateUploadSchema } from "./validator";

export async function POST(req: NextRequest) {
  const auth = await requireGestorPFWithScope();
  if (auth.error) return auth.error;
  
  const data = await req.formData();
  const validation = validateUploadSchema(data);
  if (!validation.success) return badRequest(validation.error);
  
  const result = await processUploadService(data, auth.gestorPfId);
  return created(result);
}

// service.ts - regras de negócio isoladas
export async function processUploadService(data: FormData, gestorId: string) {
  // ... lógica complexa
}

// validator.ts - schemas Zod
export const uploadSchema = z.object({...});
```

---

## Checklist de Refatoração

### Antes de Iniciar (OBRIGATÓRIO)

- [ ] Linha base de testes estabelecida e documentada
- [ ] Testes diretos do(s) arquivo(s) refatorado(s) estão 100% verde
- [ ] Cobertura verificada e dentro do mínimo por tipo
- [ ] Se cobertura insuficiente: testes de regressão criados primeiro
- [ ] Branch de refatoração criada

### Para Pages (>200 linhas)

- [ ] Extrair componentes UI para `components/`
- [ ] Extrair hooks customizados para `hooks/` ou `./hooks/`
- [ ] Mover types para arquivo dedicado `types.ts`
- [ ] Extrair server actions para `actions.ts`
- [ ] Remover funções utilitárias inline para `lib/`
- [ ] Manter page.tsx com apenas orquestração
- [ ] Verificar complexidade ciclomática ≤ 10
- [ ] Rodar testes diretos do arquivo após cada extração

### Para API Routes (>200 linhas)

- [ ] Extrair regras de negócio para `service.ts`
- [ ] Extrair schemas de validação para `validator.ts`
- [ ] Extrair parsers para `parser.ts`
- [ ] Extrair response helpers para `responses.ts`
- [ ] Manter route.ts apenas com HTTP handling
- [ ] Verificar complexidade ciclomática ≤ 10
- [ ] Rodar testes diretos do arquivo após cada extração

### Para Libs (>200 linhas)

- [ ] Identificar domínios distintos
- [ ] Separar em múltiplos arquivos por responsabilidade
- [ ] Criar index.ts para exports
- [ ] Manter coesão interna
- [ ] Verificar complexidade ciclomática ≤ 10
- [ ] Rodar testes diretos do arquivo após cada extração

---

## Métricas de Qualidade

### Tamanho de Arquivo

| Tipo | Ideal | Máximo | Ação |
|------|-------|--------|------|
| Page.tsx | 100-150 | 200 | Refatorar se >200 |
| Component | 50-100 | 200 | Extrair se >200 |
| API Route | 50-100 | 200 | Separar se >200 |
| Hook | 30-80 | 150 | Dividir se >150 |
| Service | 80-150 | 200 | Modularizar se >200 |
| Lib util | 80-150 | 200 | Separar se >200 |

### Complexidade Ciclomática

| Tipo | Máximo | Ação |
|------|--------|------|
| Função | 10 | Refatorar se >10 |
| Arquivo | 10 | Decompor se >10 |

### Complexidade por Função

- **Linhas por função:** Máximo 20 linhas
- **Parâmetros:** Máximo 3 parâmetros (usar object params se necessário)
- **Nesting:** Máximo 2 níveis de aninhamento
- **Responsabilidades:** 1 função = 1 responsabilidade

---

## Processo de Refatoração

### Passo 1: Estabelecer Linha Base de Testes (OBRIGATÓRIO)

**NÃO PROSSEGUIR SEM ESTE PASSO.**

1. Executar testes diretos do(s) arquivo(s) refatorado(s) e garantir 100% verde
2. Verificar cobertura: `pnpm test --coverage`
3. **Se cobertura < mínima:** criar testes de regressão primeiro
4. Documentar baseline:
   ```bash
   pnpm test --coverage > baseline-coverage.txt
   ```
5. Confirmar: "Tenho testes suficientes para refatorar com segurança"

### Passo 2: Identificar
```powershell
# Listar arquivos >200 linhas
Get-ChildItem -Recurse -Include *.ts,*.tsx | 
  ForEach-Object { 
    [PSCustomObject]@{
      Path = $_.FullName
      Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    } 
  } | 
  Where-Object { $_.Lines -gt 200 } | 
  Sort-Object Lines -Descending
```

### Passo 3: Analisar
- Identificar responsabilidades misturadas
- Mapear dependências
- Calcular complexidade ciclomática por função
- Definir boundaries de extração

### Passo 4: Extrair
1. Types primeiro
2. Funções utilitárias
3. Hooks customizados
4. Componentes
5. Services

### Passo 5: Testar
- Rodar testes existentes
- Criar testes para novas unidades
- Validar comportamento
- Verificar métricas: linhas ≤ 200, complexidade ≤ 10
- Confirmar cobertura mantida ou melhorada

### Passo 6: Commit
```bash
git add .
git commit -m "refactor: extract hooks and components from comissoes-gestao page

Baseline:
- Tests: X passing, X% coverage
- Verified: pnpm test && pnpm build

Changes:
- Extract useComerciais, useMetas, useComissoes hooks
- Extract ComerciaisList, MetasForm, ComissoesTable components
- Create dedicated types.ts file
- Keep page.tsx with 150 lines (was 1271)
- All files under 200 lines
- All cyclomatic complexity ≤ 10
- Coverage maintained or improved

Part of: refactoring policy v2.0 - baseline tests, max 200 lines, complexity ≤ 10"
```

---

## Exemplo Prático: Refatoração de comissoes-gestao/page.tsx

### Estado Atual
- **1271 linhas** → viola limite de 200 linhas
- **Complexidade ciclomática estimada:** > 50 → viola limite de 10
- Múltiplas responsabilidades
- Types inline
- Hooks inline
- Componentes inline

### Passo 1: Estabelecer Linha Base de Testes (ANTES de qualquer alteração)

```bash
# 1. Executar testes
pnpm test

# 2. Verificar cobertura
pnpm test --coverage

# 3. Documentar baseline
# - X testes passando
# - Cobertura: X%
# - Fluxos cobertos: [lista]

# 4. Se cobertura < 85% (Page): CRIAR TESTES DE REGRESSÃO PRIMEIRO
# 5. Só então prosseguir para extração
```

### Estado Desejado (Após Refatoração)

```
comissoes-gestao/
├── page.tsx (150 linhas) - orquestração apenas
├── components/
│   ├── comerciais-list.tsx (120 linhas)
│   ├── metas-form.tsx (140 linhas)
│   ├── comissoes-table.tsx (180 linhas)
│   ├── regras-panel.tsx (130 linhas)
│   └── comercial-modal.tsx (110 linhas)
├── hooks/
│   ├── use-comerciais.ts (60 linhas)
│   ├── use-metas.ts (70 linhas)
│   ├── use-comissoes.ts (75 linhas)
│   └── use-regras.ts (55 linhas)
├── actions.ts (120 linhas)
├── types.ts (100 linhas)
└── utils.ts (80 linhas)
```

### Total: 10 arquivos
- **Média de linhas:** 116 linhas por arquivo
- **Complexidade máxima por arquivo:** ≤ 10
- **Nenhum arquivo excede 200 linhas**

---

## Ferramentas Úteis

### PowerShell Scripts

```powershell
# Contar linhas por arquivo
Get-ChildItem -Recurse -Include *.ts,*.tsx | 
  ForEach-Object { 
    [PSCustomObject]@{
      Path = $_.FullName.Replace((Get-Location).Path + "\", "")
      Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    } 
  } | Sort-Object Lines -Descending | Format-Table -AutoSize

# Find files >200 lines
Get-ChildItem -Recurse -Include *.ts,*.tsx | 
  ForEach-Object { 
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($lines -gt 200) { 
      [PSCustomObject]@{
        Path = $_.FullName.Replace((Get-Location).Path + "\", "")
        Lines = $lines
      } 
    }
  } | Sort-Object Lines -Descending
```

### Medição de Complexidade Ciclomática

```bash
# Usar ts-complexity ou plato para medir complexidade
npx ts-complexity src/**/*.ts --max 10
```

Ou instalar localmente:
```bash
pnpm add -D ts-complexity
```

Adicionar ao `package.json`:
```json
{
  "scripts": {
    "check:complexity": "ts-complexity 'src/**/*.ts' --max 10",
    "check:sizes": "node scripts/check-file-sizes.js",
    "check:quality": "pnpm check:sizes && pnpm check:complexity"
  }
}
```

### Script de Validação Automatizada

```javascript
// scripts/check-quality.js
const fs = require('fs');
const path = require('path');

const MAX_LINES = 200;
const MAX_CYCLOMATIC = 10;
const IGNORE_PATTERNS = [
  '.next/',
  'node_modules/',
  '*.test.ts',
  '*.spec.ts'
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  
  if (lines > MAX_LINES) {
    console.error(`❌ ${filePath}: ${lines} lines (max: ${MAX_LINES})`);
    return false;
  }
  
  // Complexidade ciclomática simplificada
  const complexity = calculateCyclomaticComplexity(content);
  if (complexity > MAX_CYCLOMATIC) {
    console.error(`❌ ${filePath}: cyclomatic complexity ${complexity} (max: ${MAX_CYCLOMATIC})`);
    return false;
  }
  
  console.log(`✅ ${filePath}: ${lines} lines, complexity ${complexity}`);
  return true;
}

function calculateCyclomaticComplexity(code) {
  const keywords = [
    'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'catch', '&&', '||', '?', ':', '&', '|', '^'
  ];
  let complexity = 1;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = code.match(regex);
    if (matches) complexity += matches.length;
  });
  return complexity;
}

function checkDirectory(dir) {
  let hasErrors = false;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !IGNORE_PATTERNS.some(p => filePath.includes(p))) {
      hasErrors = !checkDirectory(filePath) || hasErrors;
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!checkFile(filePath)) hasErrors = true;
    }
  });
  
  return !hasErrors;
}

const srcDir = process.argv[2] || 'src';
const success = checkDirectory(srcDir);
process.exit(success ? 0 : 1);
```

### VS Code Extensions Recomendadas
- **CodeMetrics** - Complexidade de código
- **TODO Highlight** - Marcar refatorações pendentes
- **Import Cost** - Ver tamanho de imports

---

## Guidelines por Camada

### Database (Prisma)
- Models bem definidos no schema.prisma
- Queries via Prisma Client
- Migrations versionadas
- Seeds para desenvolvimento

### Shared (Types & Schemas)
- Types TypeScript em `packages/shared/src/types.ts`
- Schemas Zod em `packages/shared/src/schemas.ts`
- Constants em `packages/shared/src/constants.ts`
- Máximo 200 linhas por arquivo

### Web (Next.js)
- **Pages:** Apenas orquestração (máx 200 linhas)
- **Components:** Reutilizáveis e testáveis (máx 200 linhas)
- **Hooks:** Lógica de estado e efeitos (máx 150 linhas)
- **Services:** Regras de negócio (máx 200 linhas)
- **Utils:** Funções puras e helpers (máx 200 linhas)

### API Routes
- **route.ts:** Apenas HTTP handling (máx 200 linhas)
- **service.ts:** Regras de negócio isoladas (máx 200 linhas)
- **validator.ts:** Schemas Zod (máx 150 linhas)

---

## Prevenção

### Pre-commit Hook
```json
// package.json
{
  "scripts": {
    "pre-commit": "pnpm lint && pnpm check:quality",
    "check:sizes": "node scripts/check-quality.js",
    "check:complexity": "npx ts-complexity 'src/**/*.ts' --max 10",
    "check:quality": "node scripts/check-quality.js"
  }
}
```

```javascript
// scripts/check-quality.js
const fs = require('fs');
const path = require('path');

const MAX_LINES = 200;
const MAX_CYCLOMATIC = 10;
const IGNORE_PATTERNS = [
  '.next/',
  'node_modules/',
  '*.test.ts',
  '*.spec.ts'
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  
  if (lines > MAX_LINES) {
    console.error(`❌ ${filePath}: ${lines} lines (max: ${MAX_LINES})`);
    return false;
  }
  
  const complexity = calculateCyclomaticComplexity(content);
  if (complexity > MAX_CYCLOMATIC) {
    console.error(`❌ ${filePath}: cyclomatic complexity ${complexity} (max: ${MAX_CYCLOMATIC})`);
    return false;
  }
  
  console.log(`✅ ${filePath}: ${lines} lines, complexity ${complexity}`);
  return true;
}

function calculateCyclomaticComplexity(code) {
  const keywords = [
    'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'catch', '&&', '||', '?', ':', '&', '|', '^'
  ];
  let complexity = 1;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = code.match(regex);
    if (matches) complexity += matches.length;
  });
  return complexity;
}

function checkDirectory(dir) {
  let hasErrors = false;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !IGNORE_PATTERNS.some(p => filePath.includes(p))) {
      hasErrors = !checkDirectory(filePath) || hasErrors;
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!checkFile(filePath)) hasErrors = true;
    }
  });
  
  return !hasErrors;
}

const srcDir = process.argv[2] || 'apps/web/src';
const success = checkDirectory(srcDir);
process.exit(success ? 0 : 1);
```

### Code Review Checklist
- [ ] Arquivo tem menos de 200 linhas?
- [ ] Complexidade ciclomática ≤ 10?
- [ ] Funções têm menos de 20 linhas?
- [ ] Componentes são reutilizáveis?
- [ ] Hooks estão extraídos?
- [ ] Types estão em arquivo dedicado?
- [ ] Regras de negócio estão em services?

---

## Documentação Relacionada

- `docs/ARCHITECTURE_IMPROVEMENTS.md` - Melhorias de arquitetura
- `docs/SISTEMA_PONTOS_IMPLEMENTACAO.md` - Sistema de pontos
- `docs/TESTES_COMPLETOS_COMISSOES.md` - Testes de comissões

---

## Revisão e Atualização

Esta política deve ser revisada trimestralmente e atualizada conforme:
- Novos padrões da indústria
- Mudanças na stack tecnológica
- Lições aprendidas em refatorações
- Feedback do time

**Última atualização:** Setembro 2026
**Próxima revisão:** Dezembro 2026

---

## Referências

- `docs/ARCHITECTURE_IMPROVEMENTS.md` - Melhorias de arquitetura
- `docs/SISTEMA_PONTOS_IMPLEMENTACAO.md` - Sistema de pontos
- `docs/TESTES_COMPLETOS_COMISSOES.md` - Testes de comissões
- `AGENTS.md` - Convenções gerais do monorepo