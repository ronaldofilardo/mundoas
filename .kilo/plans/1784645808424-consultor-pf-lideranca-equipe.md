# Plano: Mecanismo de Perfil LIDERANCA com Equipe de consultor_pf + Dashboards

## Contexto
Atualmente o sistema já possui:
- Enum `TipoUsuario` com valor `LIDERANCA`
- Model `Lideranca` com tipo `COMERCIAL` ou `GESTOR`
- Model `Comercial` com campo `liderancaId` nullable
- Ao criar um `Comercial` com `lideranca = "COMERCIAL"`, o sistema cria/busca um registro `Lideranca`

## Objetivo
1. Quando um `Comercial` for cadastrado com `lideranca = true`, ele se torna uma `LIDERANCA` que pode gerenciar uma equipe composta por um ou mais perfis `consultor_pf` (novo perfil com login próprio).
2. Para o **Backoffice**: criar aba 'Equipes' no Comissionamento listando todas as lideranças e suas equipes.
3. Para o **login Liderança**: criar dashboard com sidebars 'Equipe' (gerir própria equipe) e 'Metas' (metas da liderança + metas de cada consultor_pf + metas da própria equipe).

## Decisões de Design

1. **`consultor_pf` terá usuário próprio para login** (confirmado)
2. **Relacionamento**: 1 `Lideranca` → N `consultor_pf` (cada consultor_pf pertence a apenas uma liderança)
3. **Metas**: A liderança terá metas próprias (`MetaLideranca`), além das metas individuais de cada `consultor_pf` (`MetaConsultorPf`) e `MetaComercial` existente para comerciais
4. **Localização**: `consultor_pf` será gerenciado dentro do escopo da `Lideranca` (dashboard `/lideranca`)

## Tarefas

### 1. Alterar Prisma Schema
**Arquivo:** `packages/database/prisma/schema.prisma`

- Adicionar `CONSULTOR_PF` ao enum `TipoUsuario` (linha 614)
- Adicionar `consultorPf ConsultorPf?` ao model `Usuario` (linha 10)
- Criar model `ConsultorPf` (após `Comercial`, linha ~289):
  - `id` (uuid, pk)
  - `usuarioId` (uuid, unique) → `Usuario`
  - `nome` (VarChar 255)
  - `cpf` (VarChar 14, unique)
  - `liderancaId` (uuid) → `Lideranca` (onDelete: Restrict)
  - `status` (StatusUsuario, default ATIVO)
  - `criadoEm`, `atualizadoEm`
  - Relacionamentos: `usuario`, `lideranca`, `metas` (MetaConsultorPf[])
- Adicionar `consultorPfs ConsultorPf[]` ao model `Lideranca` (linha 229)
- Criar model `MetaConsultorPf` (após `MetaComercial`, linha ~304):
  - `id` (uuid, pk)
  - `consultorPfId` (uuid) → `ConsultorPf` (onDelete: Cascade)
  - `mesReferencia` (string)
  - `valorMeta` (Decimal 12,2, default 0)
  - `valorAtingido` (Decimal 12,2, default 0)
  - `criadoEm`, `atualizadoEm`
  - `@@unique([consultorPfId, mesReferencia])`
  - `@@index([consultorPfId])`
- Criar model `MetaLideranca` (após `MetaConsultorPf`):
  - `id` (uuid, pk)
  - `liderancaId` (uuid) → `Lideranca` (onDelete: Cascade)
  - `mesReferencia` (string)
  - `valorMeta` (Decimal 12,2, default 0)
  - `valorAtingido` (Decimal 12,2, default 0)
  - `criadoEm`, `atualizadoEm`
  - `@@unique([liderancaId, mesReferencia])`
  - `@@index([liderancaId])`

### 2. Gerar e Aplicar Migração
```bash
cd packages/database
npx prisma migrate dev --name add-consultor-pf-metas-lideranca
```

### 3. Atualizar Tipos Compartilhados
**Arquivo:** `packages/shared/src/types.ts`

- Adicionar `"CONSULTOR_PF"` ao tipo `TipoUsuario` (linha 1)

### 4. Criar API Endpoints para `consultor_pf`
**Diretório:** `apps/web/app/api/v1/lideranca/consultores-pf/`

**GET** - Listar consultores_pf da liderança:
- Escopo: `requireLiderancaWithScope()`
- Query: `findMany` onde `liderancaId = lideranca.id`
- Include: `usuario` (select email, status), `metas`

**POST** - Criar consultor_pf:
- Escopo: `requireLiderancaWithScope("COMERCIAL")`
- Schema: nome, email, cpf (obrigatórios), telefone (opcional)
- Transação:
  1. Criar `Usuario` com tipo `CONSULTOR_PF`, senha provisória
  2. Criar `ConsultorPf` vinculado à `lideranca.id` e ao `usuario.id`
  3. Retornar senha temporária

**PATCH** `[id]` - Atualizar consultor_pf (nome, telefone, status)
**DELETE** `[id]` - Remover consultor_pf (soft delete via status = INATIVO)

### 5. Atualizar Endpoint de Equipe
**Arquivo:** `apps/web/app/api/v1/lideranca/equipe/route.ts`

- Adicionar `consultoresPf` (com `metas` e `usuario`) ao include da query da `Lideranca`
- Retornar lista de consultores_pf no response

### 6. Criar API Endpoints para Metas da Liderança
**Diretórios:**

**A. Metas da Liderança** - `apps/web/app/api/v1/lideranca/metas/route.ts`
- **GET**: Listar metas da liderança + metas agregadas da equipe
  - Escopo: `requireLiderancaWithScope()`
  - Buscar `MetaLideranca` onde `liderancaId = lideranca.id`
  - Buscar `MetaComercial` dos comerciais da liderança
  - Buscar `MetaConsultorPf` dos consultor_pfs da liderança
  - Retornar: metas da liderança, metas por comercial, metas por consultor_pf
- **POST**: Criar/atualizar meta da liderança
  - Schema: mesReferencia, valorMeta
  - Upsert em `MetaLideranca`

**B. Metas de Consultor PF** - `apps/web/app/api/v1/lideranca/consultores-pf/[id]/metas/route.ts`
- **GET**: Listar metas de um consultor_pf específico
- **POST**: Criar/atualizar meta do consultor_pf

### 7. Atualizar Endpoint de Equipe do Backoffice (para aba Equipes)
**Novo arquivo:** `apps/web/app/api/v1/backoffice/equipes/route.ts`
- **GET**: Listar todas as lideranças do backoffice com suas equipes
  - Escopo: `requireBackofficeWithScope()`
  - Buscar `Lideranca` onde `backofficeId = backofficeId`
  - Include: `comerciais` (com `usuario`), `gestores` (com `usuario`), `consultorPfs` (com `usuario`)
  - Retornar lista estruturada

### 8. Criar Páginas do Dashboard Liderança
**Diretórios:**
- `apps/web/app/(dashboard)/lideranca/equipe/page.tsx` (já existe como `/lideranca`)
- `apps/web/app/(dashboard)/lideranca/equipe/consultores-pf/page.tsx`
- `apps/web/app/(dashboard)/lideranca/consultores-pf/novo/page.tsx`
- `apps/web/app/(dashboard)/lideranca/metas/page.tsx`

**Estrutura de navegação lateral do dashboard liderança:**
- `/lideranca` - Dashboard (visão geral)
- `/lideranca/equipe` - Gerenciar equipe (comerciais, gestores, consultor_pfs)
  - Sub-páginas: comerciais, gestores, consultores-pf
- `/lideranca/metas` - Metas da liderança e equipe

**Listagem Consultores PF (`/lideranca/equipe/consultores-pf`)**:
- Tabela com: Nome, Email, CPF, Telefone, Status, Criado em
- Botão "Novo Consultor PF"

**Criação Consultor PF (`/lideranca/consultores-pf/novo`)**:
- Formulário: Nome, Email, CPF, Telefone
- Exibir senha provisória após criação (5 primeiros dígitos do CPF)

**Metas (`/lideranca/metas`)**:
- Cards com resumo: Meta da Liderança, Meta Total da Equipe
- Tabela de metas por membro:
  - Comerciais: nome, meta, atingido, %
  - Gestores: nome, meta, atingido, %
  - Consultores PF: nome, meta, atingido, %
- Formulário para editar meta da liderança

### 9. Criar Aba "Equipes" no Backoffice
**Arquivo:** `apps/web/app/(dashboard)/backoffice/comissionamento/page.tsx`
- Adicionar nova tab "Equipes" às tabs existentes (Comerciais, Regras, Equipes)
- Criar componente `tab-equipes.tsx` em `apps/web/app/(dashboard)/backoffice/comissionamento/components/`

**Conteúdo da aba Equipes:**
- Listar todas as lideranças do backoffice
- Para cada liderança, mostrar:
  - Nome da liderança
  - Tipo (COMERCIAL/GESTOR)
  - Quantidade de comerciais
  - Quantidade de gestores
  - Quantidade de consultor_pfs
  - Total de parceiros na equipe
- Expansível para ver detalhes da equipe

**Novo componente:** `apps/web/app/(dashboard)/backoffice/comissionamento/components/tab-equipes.tsx`

### 10. Atualizar Navegação do Dashboard Liderança
**Arquivo:** `apps/web/app/(dashboard)/lideranca/page.tsx` e sidebar

- Adicionar sidebar específica para LIDERANCA com:
  - Dashboard
  - Equipe (com subitens: Comerciais, Gestores, Consultores PF)
  - Metas
- Atualizar `components/sidebar.tsx` para incluir `liderancaNav`

### 11. Atualizar Testes
- Atualizar `packages/shared/tests/schemas.test.ts` se houver validação de `TipoUsuario`
- Adicionar testes para novos endpoints:
  - `consultores-pf` (CRUD)
  - `metas` (liderança e consultor_pf)
  - `backoffice/equipes` (listagem)
- Atualizar `apps/web/app/(dashboard)/backoffice/comissionamento/components/tab-equipes.tsx` com testes de integração

## Validação

1. Aplicar migração: `npx prisma migrate dev`
2. Rodar seed/tests: `pnpm test`
3. Verificar que `TipoUsuario` inclui `CONSULTOR_PF`
4. Testar fluxo E2E:
   - Criar Comercial com `lideranca = "COMERCIAL"`
   - Acessar `/lideranca/equipe/consultores-pf`
   - Criar consultor_pf
   - Verificar login com senha provisória
   - Acessar `/lideranca/metas` e criar meta para liderança
   - Acessar `/backoffice/comissionamento?tab=equipes` e verificar listagem

## Riscos e Considerações

- **Login do consultor_pf**: Como terá `Usuario` com tipo `CONSULTOR_PF`, precisará de permissões de rota adequadas (pode precisar de `requireConsultorPfWithScope` se houver rotas específicas)
- **Senha provisória**: Reutilizar padrão existente (5 primeiros dígitos do CPF)
- **CPF duplicado**: Validar unicidade tanto em `Usuario.email` quanto em `ConsultorPf.cpf`
- **Metas agregadas**: A equipe da liderança pode ter metas compostas por metas individuais + meta da liderança. Definir claramente como calcular o total.
- **Backoffice Equipes**: A aba deve ser adicionada apenas para usuários BACKOFFICE/GESTOR com papel BACKOFFICE.
