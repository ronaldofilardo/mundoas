# AGENTS.md — Convenções do monorepo mundoas

> Notas operacionais para IAs e humanos. Adicione aqui apenas regras duradouras
> que **evitam** problemas recorrentes.

## Resolução do `@prisma/client` — NUNCA instalar órfão

### Por quê
O Node resolve módulos subindo a hierarquia de pastas a partir do `cwd`. Se
existir um `@prisma/client` em uma pasta **acima** de `C:\apps\mundoas` (por
exemplo, em `C:\Users\<user>\node_modules\@prisma\client` de outro projeto
pessoal), o Next.js **vai usá-lo em vez do client do monorepo**. Isso causa
erros `P2022: column does not exist` mesmo com a migration aplicada no banco,
porque o DMMF embedded no client órfão está desatualizado.

Sintomas típicos:
- A migration está aplicada no DB (verificar com `psql` ou `prisma migrate status`).
- `pnpm --filter @asa/database build` regenera o client corretamente.
- Mas o erro `P2022` persiste em runtime.
- O caminho em `node_modules/.pnpm/@prisma+client/.../runtime/library.js`
  refere-se a uma versão diferente da esperada (`6.19.3` em vez de `6.19.2`).

### Regras obrigatórias

1. **Importe o cliente sempre via `apps/web/lib/db.ts`**. Nunca faça
   `import { prisma } from "@asa/database"` nem `import { PrismaClient } from
   "@prisma/client"` direto nos handlers. O helper `lib/db.ts` valida a
   resolução em runtime e falha alto com mensagem clara se detectar anomalia.

2. **Não instale `@prisma/client` nem `prisma` fora do monorepo**. Projetos em
   `C:\Users\<user>\` ou em outras pastas fora de `C:\apps\mundoas` podem ter
   seus próprios `node_modules` que vazam via resolução do Node. Se você
   precisa usar Prisma em outro projeto, isole-o (ex.: em uma subpasta própria
   com `node_modules` próprio).

3. **`package.json` raiz fixa as versões** via `pnpm.overrides` e `resolutions`
   para `@prisma/client@6.19.2` e `prisma@6.19.2`. Não remova essas entradas.

4. **Existe um preinstall hook** (`scripts/check-prisma-resolution.mjs`) que
   aborta `pnpm install` se detectar versão errada ou instalação órfã. Não
   remova esse hook.

### Como diagnosticar e corrigir

```powershell
# 1) Verificar se há @prisma/client órfão acima do monorepo
Get-ChildItem "C:\Users\ronal\node_modules\@prisma" -ErrorAction SilentlyContinue
Get-ChildItem "C:\node_modules\@prisma" -ErrorAction SilentlyContinue

# 2) Se existir, remover
Remove-Item -Recurse -Force "C:\Users\ronal\node_modules\@prisma"
Remove-Item -Recurse -Force "C:\Users\ronal\node_modules\.prisma"
Remove-Item -Recurse -Force "C:\Users\ronal\node_modules\.pnpm\@prisma+client*"

# 3) Limpar caches do Next.js e do pnpm
Remove-Item -Recurse -Force "C:\apps\mundoas\apps\web\.next"
Remove-Item -Recurse -Force "C:\apps\mundoas\node_modules\.cache"

# 4) Reinstalar o monorepo
cd C:\apps\mundoas
pnpm install --force

# 5) Regenerar o Prisma client (gera o DMMF a partir do schema.prisma)
pnpm --filter @asa/database build

# 6) Reiniciar o dev server
pnpm dev
```

### Verificação manual rápida

```powershell
# Confirmar versão no client do monorepo
Select-String -Path "C:\apps\mundoas\node_modules\.pnpm\@prisma+client@6.19.2*\node_modules\@prisma\client\package.json" -Pattern '"version"'

# Confirmar versão no client órfão (deve estar vazio após limpeza)
Get-ChildItem "C:\Users\ronal\node_modules\@prisma" -ErrorAction SilentlyContinue

# Testar query real
node -e "const p=new (require('@prisma/client').PrismaClient)(); p.lideranca.findMany({take:1}).then(r=>console.log('OK',r.length)).catch(e=>console.log('ERR',e.message)).finally(()=>p.$disconnect())"
```
