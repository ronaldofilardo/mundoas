# Registrar o baseline do Neon após a reconciliação estrutural.
# Executar a partir de C:\apps\mundoas.
# Este script altera somente o ledger _prisma_migrations via migrate resolve.

$ErrorActionPreference = 'Stop'
Set-Location 'C:\apps\mundoas\packages\database'
$env:DATABASE_URL = 'postgresql://neondb_owner:npg_mw9oUhy1rPXB@ep-fancy-lab-acspewds-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

function Invoke-PnpmCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$Label
  )

  $tempRoot = Join-Path $env:TEMP ("mundoas-baseline-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
  $stdoutPath = Join-Path $tempRoot 'stdout.txt'
  $stderrPath = Join-Path $tempRoot 'stderr.txt'

  try {
    $process = Start-Process `
      -FilePath 'cmd.exe' `
      -ArgumentList '/d', '/c', "pnpm.cmd $Command" `
      -WorkingDirectory (Get-Location).Path `
      -RedirectStandardOutput $stdoutPath `
      -RedirectStandardError $stderrPath `
      -NoNewWindow `
      -PassThru `
      -Wait

    if (Test-Path $stdoutPath) { Get-Content -LiteralPath $stdoutPath | ForEach-Object { Write-Host $_ } }
    if (Test-Path $stderrPath) { Get-Content -LiteralPath $stderrPath | ForEach-Object { Write-Warning $_ } }

    if ($process.ExitCode -ne 0) {
      throw "$Label falhou com exit code $($process.ExitCode)."
    }
  }
  finally {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

try {
  # Com ledger vazio, migrate status retorna exit code 1 porque todas as migrations
  # aparecem como pendentes. Esse é o estado esperado antes do baseline; portanto,
  # não usamos migrate status como pré-condição.
  $migrations = Get-ChildItem .\prisma\migrations -Directory | Sort-Object Name
  if ($migrations.Count -ne 75) {
    throw "Esperadas 75 migrations no projeto local; encontradas $($migrations.Count). Baseline não registrado."
  }

  foreach ($migration in $migrations) {
    Write-Host "Registrando: $($migration.Name)"
    Invoke-PnpmCommand `
      -Command "exec prisma migrate resolve --applied $($migration.Name) --schema .\prisma\schema.prisma" `
      -Label "registro de $($migration.Name)"
  }

  Write-Host 'Baseline registrado. Validando status final...'
  Invoke-PnpmCommand `
    -Command 'exec prisma migrate status --schema .\prisma\schema.prisma' `
    -Label 'validação final do status'
}
finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}
