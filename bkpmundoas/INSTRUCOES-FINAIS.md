# BKPMundoAS — Instruções finais de aplicação

## Escopo

Este pacote consolida os arquivos dos Passos 1–51 disponíveis na auditoria. O achado A-08 não foi implementado por decisão expressa do responsável; permanece apenas mitigado pela não exposição das credenciais na UI/JSON.

## Aplicação

No PowerShell:

```powershell
$zip = Join-Path $HOME "Downloads\bkpmundoas-final-consolidado.zip"
$destino = "C:\apps\mundoas"

if (-not (Test-Path -LiteralPath $zip)) {
  throw "ZIP não encontrado em: $zip"
}

Expand-Archive -LiteralPath $zip -DestinationPath $destino -Force
Set-Location $destino
```

O pacote não inclui `.env`, `.git`, `node_modules` ou artefatos `.next`. Preserve os arquivos de ambiente locais existentes.

## Banco de teste

```powershell
Set-Location "C:\apps\mundoas"

$linhaDatabaseUrl = Get-Content ".env.test" |
  Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } |
  Select-Object -First 1

if (-not $linhaDatabaseUrl) {
  throw "DATABASE_URL não encontrada em .env.test"
}

$databaseUrl = ($linhaDatabaseUrl -replace '^\s*DATABASE_URL\s*=\s*', '').Trim()
$databaseUrl = $databaseUrl.Trim('"').Trim("'")

if ($databaseUrl -notmatch '^postgres(ql)?://') {
  throw "DATABASE_URL inválida"
}

$env:DATABASE_URL = $databaseUrl
pnpm --filter @asa/database exec prisma generate
pnpm --filter @asa/database exec prisma migrate deploy
pnpm --filter @asa/database exec prisma migrate status
```

O status esperado é `Database schema is up to date!`.

## Testes focados

```powershell
pnpm --filter web exec vitest run `
  app/__tests__/consultor-pf-contrato-idor.test.ts `
  app/__tests__/finance-endpoints-contract.test.ts `
  app/__tests__/regras-api.test.ts `
  lib/__tests__/competencia.test.ts `
  lib/__tests__/comissao-calculo.test.ts `
  lib/__tests__/pontos-utils-comissao-pf.test.ts `
  app/__tests__/upload-producao-persistencia.test.ts `
  app/__tests__/upload-comissoes.test.ts
```

A suíte consolidada aprovada nos logs totalizou 95 testes, além dos smoke tests corrigidos do Passo 51.

## Validação de release

```powershell
pnpm --filter @asa/database exec prisma migrate status
pnpm --filter web exec tsc --noEmit
pnpm --filter web exec next lint
pnpm --filter web build
```

Também execute:

```powershell
git diff --check
```

O build deve terminar sem erros de TypeScript. Avisos de depreciação do Prisma 6 sobre `package.json#prisma` não são falhas do pacote, mas devem ser tratados futuramente antes do Prisma 7.

## Próxima manutenção recomendada

A matriz A-01–A-14 deve registrar A-08 como excluído por decisão, e A-14 como validado somente após a execução local do gate completo acima. As migrations 61 e 62 devem permanecer aplicadas no banco de teste e no banco de produção conforme o procedimento de deploy da equipe.
