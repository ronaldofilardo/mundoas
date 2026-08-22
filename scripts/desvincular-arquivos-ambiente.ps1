[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$arquivosAmbiente = @(
  ".env",
  ".env.local",
  ".env.test",
  ".env.production"
)

$versionados = @(git ls-files -- $arquivosAmbiente)
if ($LASTEXITCODE -ne 0) {
  throw "Não foi possível consultar o índice Git."
}

if ($versionados.Count -eq 0) {
  Write-Host "Nenhum arquivo de ambiente está versionado." -ForegroundColor Green
  exit 0
}

foreach ($arquivo in $versionados) {
  git rm --cached -- $arquivo
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao remover do índice Git: $arquivo"
  }
  Write-Host "Removido do índice Git; arquivo local preservado: $arquivo" -ForegroundColor Yellow
}

Write-Host "Concluído. Revise o diff e faça um commit para efetivar a remoção do versionamento." -ForegroundColor Green
