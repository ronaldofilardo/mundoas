# Pacote consolidado bkpmundoas — Passos 1–36

## Status da entrega

Este pacote reúne automaticamente os arquivos alterados nos Passos 1–36 da auditoria técnica de `bkpmundoas`. Ele é uma **entrega parcial consolidada**: contém as correções implementadas e validadas incrementalmente, mas não deve ser interpretado como declaração de que 100% dos achados A-01 a A-14 foram encerrados.

O A-08 permanece mitigado: senhas provisórias foram removidas das respostas JSON e da interface, porém o fluxo estrutural por convite/token ainda não foi implementado. O A-14 também depende da execução final no repositório local, incluindo lint global, typecheck, testes, build, smoke tests e confirmação de histórico/segredos.

## Aplicação

O pacote contém somente arquivos alterados, não uma cópia integral do projeto. Faça backup ou commit local antes da aplicação e extraia o ZIP na raiz `C:\apps\mundoas`.

```powershell
$zip = Join-Path $HOME "Downloads\bkpmundoas-correcao-consolidado-step-36.zip"
$destino = "C:\apps\mundoas"

if (-not (Test-Path $zip)) {
  throw "ZIP não encontrado em: $zip"
}

Expand-Archive -LiteralPath $zip -DestinationPath $destino -Force
Set-Location $destino

Write-Host "Pacote consolidado dos Passos 1–36 aplicado." -ForegroundColor Green
```

## Validação recomendada

```powershell
Set-Location C:\apps\mundoas

pnpm install --frozen-lockfile
pnpm --filter @asa/database exec prisma migrate status
pnpm --filter web exec tsc --noEmit
pnpm lint
pnpm build
```

Execute os testes focados já validados nos passos anteriores e, depois, a matriz completa disponível no workspace. Não presuma nomes de arquivos ausentes; liste os testes reais antes de montar o comando.

```powershell
Get-ChildItem -Path .\apps\web -Recurse -File -Include '*.test.ts','*.test.tsx' |
  Select-Object -ExpandProperty FullName
```

## Correções reunidas

O pacote reúne correções de autorização e escopo, produção PF, metas por setor/mês, cálculo de comissão por tipo de procedimento, relatórios, mitigação de senha, isolamento de setores, validação de mês, revalidação de status, carregamento agregado de metas e correções de lint nos fluxos envolvidos.

## Pendências explícitas

| Achado | Estado neste pacote |
|---|---|
| A-01, A-02, A-03, A-06, A-07, A-09 | Núcleo corrigido, com cobertura incremental |
| A-04, A-05, A-10, A-11, A-12, A-13 | Parcialmente corrigidos; ainda há pendências estruturais ou de cobertura |
| A-08 | Mitigação somente; falta convite/token seguro |
| A-14 | Gate criado e segredos do índice tratados, mas o gate global ainda depende do ambiente local |

Se `.env.test` ou outro arquivo de ambiente aparecer como versionado, use a rotina incluída em `scripts/desvincular-arquivos-ambiente.ps1`. Ela usa `git rm --cached` e preserva a cópia local, mas segredos que já chegaram a um remoto devem ser rotacionados.

## Limitações

O pacote foi montado fora do projeto local do usuário. A validação final de integração, banco, dependências, lint global e build deve ser feita em `C:\apps\mundoas`. O conteúdo da auditoria detalhada está no relatório `AUDITORIA_COBERTURA_A01_A14_POS_PASSO36.md`, entregue separadamente.
