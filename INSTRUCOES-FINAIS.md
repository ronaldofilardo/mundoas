# Entrega final — bkpmundoas

## Escopo concluído

Esta entrega consolida as alterações acumuladas na auditoria técnica de liderança, consultores PF, produção, pontos e comissões, incluindo as correções de tipagem, contratos de APIs, isolamento por escopo, regras de competência, persistência de uploads, validações de ciclos, acessibilidade e limpeza de lint.

A auditoria global realizada no código de produção (`apps/web/app`, `apps/web/lib`, `apps/web/components`, `apps/web/hooks` e `apps/web/types`) encontrou **zero ocorrências de `any` explícito** após o lote final. Os arquivos corrigidos preservam a meta de complexidade ciclomática máxima de 10 por função/método, sem introduzir estruturas de decisão desnecessariamente complexas.

**A-08 — tokens seguros de convite — permanece explicitamente fora do escopo**, conforme solicitado. O ZIP não deve ser interpretado como implementação dessa finding.

## Aplicação no Windows

Extraia o ZIP diretamente na raiz do projeto, substituindo os arquivos existentes:

```powershell
$zip = Join-Path $HOME "Downloads\bkpmundoas-correcao-final.zip"
$destino = "C:\apps\mundoas"

if (-not (Test-Path -LiteralPath $zip)) {
  throw "ZIP não encontrado em: $zip"
}

Expand-Archive -LiteralPath $zip -DestinationPath $destino -Force
Set-Location $destino
Write-Host "Entrega final aplicada." -ForegroundColor Green
```

O pacote contém somente arquivos alterados ou novos do workspace, mantendo os caminhos relativos do monorepo. Arquivos `.env`, credenciais e `node_modules` não fazem parte da entrega.

## Gate final recomendado

Execute os comandos abaixo na ordem. O typecheck e o build são gates obrigatórios; os testes funcionais já aprovados nas etapas anteriores não precisam ser repetidos para correções puramente de lint/tipagem.

```powershell
Set-Location "C:\apps\mundoas"

pnpm --filter web exec tsc --noEmit
pnpm --filter web exec next lint
pnpm --filter web exec next build
```

Se o projeto utilizar o pipeline Turborepo na raiz, execute também:

```powershell
pnpm build
```

## Validações funcionais já registradas

As etapas anteriores registraram suites aprovadas para contratos financeiros, regras, metas de liderança e consultores PF, uploads e persistência de produção, cálculo de comissões, competência mensal, pontos, ranking e componentes administrativos, totalizando múltiplas execuções estáveis e a última execução consolidada de 91 testes aprovados.

## Observação sobre o sandbox de preparação

A preparação automática deste pacote foi concluída. No ambiente de preparação, o gate local ficou limitado porque os binários instalados do workspace estavam sem permissão de execução e, depois da correção de permissão, o pacote local de TypeScript não estava completo (`MODULE_NOT_FOUND`). Por isso, o gate definitivo deve ser executado no workspace Windows após a extração, onde as dependências do projeto já estão instaladas.

## Arquivos prioritários do último lote

O último lote incluiu, entre outros, os seguintes arquivos:

- `apps/web/app/api/v1/auth/primeiro-acesso/route.ts`
- `apps/web/app/api/v1/comercial/minha-comissao/route.ts`
- `apps/web/app/api/v1/comercial/parceiros/route.ts`
- `apps/web/app/api/v1/parceiro/dados-pessoais/route.ts`
- `apps/web/app/api/v1/parceiro/pontos/resgates/route.ts`
- `apps/web/app/(dashboard)/backoffice/dashboard/page.tsx`
- `apps/web/app/(dashboard)/consultor/dados-pessoais/page.tsx`
- `apps/web/app/(dashboard)/parceiro/pontos/page.tsx`
- `apps/web/app/(dashboard)/parceiro/indicados/page.tsx`
- `apps/web/components/backoffice/ranking-gestor.tsx`
- `apps/web/components/backoffice/upload-planilha-preview.tsx`
- `apps/web/components/parceiro/catalogo-premios.tsx`
- `apps/web/components/parceiro/meu-ranking.tsx`

Após a aplicação, não faça alterações manuais de retorno a `any`; mantenha os contratos de resposta tipados e use `unknown` na entrada de JSON, validando-a com Zod ou conversão estrutural explícita.
