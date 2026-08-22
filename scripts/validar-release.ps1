[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipLint,
  [switch]$SkipBuild,
  [switch]$FullTest
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

function Invoke-Etapa {
  param(
    [string]$Nome,
    [scriptblock]$Acao
  )

  Write-Host "`n==> $Nome" -ForegroundColor Cyan
  & $Acao
  if ($LASTEXITCODE -ne 0) {
    throw "Falha na etapa: $Nome (exit code $LASTEXITCODE)"
  }
}

if (-not (Test-Path "pnpm-lock.yaml")) {
  throw "pnpm-lock.yaml não encontrado na raiz do projeto."
}

Invoke-Etapa "Verificar segredos versionados" {
  $segredos = @(git ls-files -- .env .env.local .env.test .env.production)
  if ($segredos.Count -gt 0) {
    throw "Arquivos de ambiente não podem ser versionados: $($segredos -join ', ')"
  }
}

Invoke-Etapa "Verificar whitespace do diff" {
  git diff --check
}

if (-not $SkipInstall) {
  Invoke-Etapa "Instalar dependências com lockfile" {
    pnpm install --frozen-lockfile
  }
}

if (-not $SkipLint) {
  Invoke-Etapa "Executar lint" {
    pnpm lint
  }
}

if ($FullTest) {
  Invoke-Etapa "Executar suíte completa" {
    pnpm test
  }
} else {
  Invoke-Etapa "Executar testes focados de consultores/metas" {
    pnpm --filter web exec vitest run `
      app/__tests__/consultor-pf-api.test.ts `
      app/__tests__/lideranca-equipe-consultores-pf-metas.test.ts `
      app/__tests__/metas-lideranca-api.test.ts
  }
}

if (-not $SkipBuild) {
  Invoke-Etapa "Executar build" {
    pnpm build
  }
}

Write-Host "`nValidação de release concluída com sucesso." -ForegroundColor Green
