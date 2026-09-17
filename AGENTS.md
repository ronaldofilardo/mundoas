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

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
