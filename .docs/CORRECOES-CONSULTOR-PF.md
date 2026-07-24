# Correções - Cadastro de Consultor PF e Página de Equipe

## Problemas Identificados

1. **Erro 404 em `/lideranca/equipe`**: A página não existia
2. **Erro 403 ao cadastrar Consultor PF**: Usuário `lider01@asa.com` não tinha registro na tabela `Lideranca`
3. **Cadastro de Consultor PF não persistia**: Erro de autenticação/autorização na API
4. **Comercial cadastrado como "Liderança" não criava registro correto**: Campo "Liderança (opcional)" não estava criando usuário do tipo LIDERANCA

## Correções Realizadas

### 1. Criação da Página `/lideranca/equipe`
**Arquivo:** `apps/web/app/(dashboard)/lideranca/equipe/page.tsx`

- Criada página para exibir resumo da equipe
- Mostra contadores de Consultores PF e Parceiros
- Links para `/lideranca/equipe/consultores-pf` e `/lideranca/consultores-pf/novo`
- Correção de null safety no contador de consultores

### 2. Fix de Dados - Usuário de Liderança
**Arquivo:** `packages/database/prisma/fix-lideranca.ts`

- Script para criar/validar usuário `lider01@asa.com` como LIDERANCA
- Cria registro na tabela `Lideranca` vinculado ao usuário
- Necessário após reset do banco de dados

### 3. Melhoria de Debug na API
**Arquivo:** `apps/web/app/api/v1/lideranca/consultores-pf/route.ts`

- Adicionados logs para debug de autenticação e criação
- Logs mostram: dados recebidos, validação, criação de usuário e consultor

### 4. Melhoria de Debug no Frontend
**Arquivo:** `apps/web/app/(dashboard)/lideranca/consultores-pf/novo/page.tsx`

- Adicionados logs no console do navegador
- Mostra dados enviados, status da resposta e erros

### 5. Comercial como Liderança ⭐ NOVO
**Arquivos:** 
- `apps/web/app/api/v1/backoffice/comerciais/route.ts`
- `apps/web/app/(dashboard)/backoffice/usuarios/comerciais/components/comercial-modal.tsx`

**Mudanças:**
- Quando o checkbox "Liderança (opcional)" é marcado, um select aparece para escolher o tipo:
  - **Comercial** → Cria usuário tipo `LIDERANCA` com `tipo: "COMERCIAL"`
  - **Gestor** → Cria usuário tipo `LIDERANCA` com `tipo: "GESTOR"`
- A API agora cria:
  1. Usuário com `tipo: "LIDERANCA"` (não mais `COMERCIAL`)
  2. Registro na tabela `Lideranca` vinculado ao backoffice
- Comercial marcado como liderança pode ter equipe (outros comerciais, gestores, consultores PF)

## Testes Criados

### Arquivo: `apps/web/app/__tests__/lideranca-equipe-consistente.test.ts`

**Descrição:** Testes de integração para cadastro e listagem de consultores PF

**Testes:**
1. `GET /api/v1/lideranca/equipe` - Retorna equipe da liderança
2. `GET /api/v1/lideranca/equipe` - Retorna totais zerados quando sem equipe
3. `GET /api/v1/lideranca/equipe` - Retorna consultores PF da equipe
4. `GET /api/v1/lideranca/equipe` - Retorna múltiplos consultores PF
5. `POST /api/v1/lideranca/consultores-pf` - Cria consultor PF com sucesso
6. `POST /api/v1/lideranca/consultores-pf` - Rejeita CPF duplicado
7. `POST /api/v1/lideranca/consultores-pf` - Rejeita email duplicado
8. `Fluxo completo` - Cadastra e lista consultor PF

**Resultado:** ✅ 8 testes passando

### Arquivo: `apps/web/app/__tests__/comercial-como-lideranca.test.ts` ⭐ NOVO

**Descrição:** Testes para comercial cadastrado como liderança

**Testes:**
1. `deve criar comercial marcado como liderança COMERCIAL` - Cria usuário LIDERANCA com tipo COMERCIAL
2. `deve criar comercial marcado como liderança GESTOR` - Cria usuário LIDERANCA com tipo GESTOR
3. `deve listar lideranças criadas como comercial` - Lista lideranças no backoffice
4. `deve permitir que liderança tenha comerciais na equipe` - Liderança pode ter equipe de comerciais

**Resultado:** ✅ 4 testes passando

### Testes Existentes Validados

**Arquivo:** `apps/web/app/__tests__/consultor-pf-api.test.ts`
- ✅ 5 testes passando

**Arquivo:** `apps/web/app/__tests__/equipes-api.test.ts`
- ✅ 6 testes passando

**Total:** 23 testes relacionados passando

## Como Usar

### 1. Reset do Banco (se necessário)
```bash
cd packages/database
pnpm prisma db push --accept-data-loss --force-reset
pnpm tsx prisma/seed.ts
pnpm tsx prisma/fix-lideranca.ts
```

### 2. Rodar Testes
```bash
cd C:\apps\ASA
pnpm vitest run apps/web/app/__tests__/lideranca-equipe-consistente.test.ts
pnpm vitest run apps/web/app/__tests__/consultor-pf-api.test.ts
pnpm vitest run apps/web/app/__tests__/equipes-api.test.ts
```

### 3. Acessar a Aplicação

1. **Login:** `lider01@asa.com`
2. **Senha:** `123456`
3. **Acessar:** `http://localhost:3000/lideranca/equipe`
4. **Cadastrar:** `http://localhost:3000/lideranca/consultores-pf/novo`

## Fluxo Funcional

1. Login como `lider01@asa.com` (tipo LIDERANCA)
2. Acessa `/lideranca/equipe` → ✅ Funciona (não dá 404)
3. Clica em "Novo Consultor PF" → `/lideranca/consultores-pf/novo`
4. Preenche formulário (nome, email, cpf, telefone)
5. Submete → API cria usuário + consultorPf em transação
6. Redireciona para `/lideranca/equipe/consultores-pf`
7. Lista mostra novo consultor cadastrado → ✅ Consistente

## Arquivos Modificados

- ✅ `apps/web/app/(dashboard)/lideranca/equipe/page.tsx` (criado)
- ✅ `apps/web/app/(dashboard)/lideranca/consultores-pf/novo/page.tsx` (logs adicionados)
- ✅ `apps/web/app/api/v1/lideranca/consultores-pf/route.ts` (logs adicionados)
- ✅ `packages/database/prisma/fix-lideranca.ts` (criado)
- ✅ `apps/web/app/__tests__/lideranca-equipe-consistente.test.ts` (criado)
- ✅ `apps/web/app/__tests__/comercial-como-lideranca.test.ts` (criado)
- ✅ `apps/web/app/api/v1/backoffice/comerciais/route.ts` (atualizado para criar liderança)
- ✅ `apps/web/app/(dashboard)/backoffice/usuarios/comerciais/components/comercial-modal.tsx` (UI atualizada)