# Correção definitiva do loop de lint/typecheck

## Causa identificada

Os últimos erros não eram warnings independentes: o lote automático anterior inseriu fragmentos como `onChange={(e) = id="campo">`, corrompendo o JSX. Isso gerou erros em cascata no TypeScript, no parser do ESLint e no build.

## Correção aplicada

Foram restaurados manualmente os callbacks `onChange` dos arquivos afetados, sem refatoração automática de JSX:

- `app/(dashboard)/parceiro/dados-pessoais/page.tsx`
- `app/acesso-pf/[token]/page.tsx`
- `app/cupom/[codigo]/page.tsx`
- `app/(dashboard)/parceiro/indicados/page.tsx`
- `app/(dashboard)/consultor/dados-pessoais/page.tsx`
- `app/(dashboard)/gestor/importar-cupons/page.tsx`

Também foram corrigidos o acesso a propriedades do corpo `unknown` em `auth/primeiro-acesso`, o parâmetro implicitamente `any` do preview de upload e a incompatibilidade de `imagemUrl` no catálogo de prêmios.

As interfaces vazias dos componentes `Dialog`, `Input` e `Table` foram convertidas em aliases de tipo, e os labels foram associados aos controles por `htmlFor`/`id`.

## Aplicação

Extraia o ZIP na raiz do projeto, substituindo os arquivos existentes:

```powershell
$zip = Join-Path $HOME "Downloads\bkpmundoas-correcao-final-71.zip"
$destino = "C:\apps\mundoas"
Expand-Archive -LiteralPath $zip -DestinationPath $destino -Force
Set-Location $destino
```

## Validação obrigatória

Execute os gates separadamente. Não encadeie comandos com `>>`, pois isso dificulta identificar qual etapa falhou:

```powershell
pnpm --filter web exec tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw "TypeScript reprovado" }

pnpm --filter web exec next lint
if ($LASTEXITCODE -ne 0) { throw "Lint reprovado" }

pnpm build
if ($LASTEXITCODE -ne 0) { throw "Build reprovado" }
```

O comando `pnpm build` sozinho não substitui o lint, porque o Next.js pode exibir `Skipping linting`. O tópico A-08 permanece fora do escopo.
