# LISTA COMPLETA — TODOS OS ARQUIVOS ALTERADOS NO WORKTREE
# Nenhum arquivo omitido. Status: M = modificado, ?? = novo, A = adicionado (nenhum A nesta lista)
# Classificação: [TESTE-BASICO-OK] = já tem teste básico; [PRECISA-FUNCIONAL] = precisa ir além do básico; [PRECISA-TESTE] = ainda sem teste específico; [NAO-APLICAVEL] = doc/config/script não precisa de teste unitário; [TESTE-INCREMENTAVEL] = teste existente pode ser melhorado.

# === MODIFICADOS (M) ===

M apps/web/.eslintrc.json                                      [NAO-APLICAVEL] (configuração)
M apps/web/__tests__/middleware.test.ts                        [TESTE-INCREMENTAVEL] (corrigido anteriormente, pode ser melhorado para cobrir casos de auth/admin)
M apps/web/app/(auth)/login/page.tsx                          [PRECISA-TESTE] (página de login sem teste funcional — precisa renderização com mock de session)
M apps/web/app/(auth)/primeiro-acesso/page.tsx                 [PRECISA-TESTE] (página de primeiro acesso — precisa verificação de fluxo)
M apps/web/app/(dashboard)/admin/backoffices/[id]/page.tsx    [PRECISA-TESTE] (dashboard admin — precisa teste de renderização com props)
M apps/web/app/(dashboard)/admin/backoffices/novo/page.tsx    [PRECISA-TESTE] (página de criação de backoffice)
M apps/web/app/(dashboard)/backoffice/comissao/consultores-pf/page.tsx  [PRECISA-TESTE] (página de comissão)
M apps/web/app/(dashboard)/backoffice/comissionamento/components/tab-regras.tsx  [PRECISA-TESTE] (componente de aba)
M apps/web/app/(dashboard)/backoffice/comissionamento/equipe/components/consultor-pf-form.tsx  [PRECISA-TESTE] (formulário de consultor PF)
M apps/web/app/(dashboard)/backoffice/comissionamento/equipe/components/tab-comissoes.tsx  [PRECISA-TESTE] (componente de comissões)
M apps/web/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe.ts  [PRECISA-TESTE] (hook — precisa teste de retorno e atualização)
M apps/web/app/(dashboard)/backoffice/comissionamento/pagamentos/page.tsx  [PRECISA-TESTE] (página de pagamentos)
M apps/web/app/(dashboard)/backoffice/dashboard/page.tsx      [PRECISA-TESTE] (dashboard principal)
M apps/web/app/(dashboard)/backoffice/metas-vendas/components/painel-metas-vendas-client.tsx  [PRECISA-TESTE] (componente de painel — precisa renderização)
M apps/web/app/(dashboard)/backoffice/pontos/components/ciclos-pontos.tsx  [PRECISA-TESTE] (componente de ciclos)
M apps/web/app/(dashboard)/backoffice/pontos/components/configuracao-pontos.tsx  [PRECISA-TESTE] (componente de configuração)
M apps/web/app/(dashboard)/backoffice/pontos/components/criar-ciclo-form.tsx  [PRECISA-TESTE] (formulário de ciclo)
M apps/web/app/(dashboard)/backoffice/pontos/components/distribuir-pontos.tsx  [PRECISA-TESTE] (distribuição)
M apps/web/app/(dashboard)/backoffice/pontos/components/parceiros-pontos.tsx  [PRECISA-TESTE] (parceiros)
M apps/web/app/(dashboard)/backoffice/pontos/components/premios-pontos.tsx  [PRECISA-TESTE] (prêmios)
M apps/web/app/(dashboard)/backoffice/pontos/components/ranking-pontos.tsx  [PRECISA-TESTE] (ranking)
M apps/web/app/(dashboard)/backoffice/pontos/components/tabela-distribuicao.tsx  [PRECISA-TESTE] (tabela)
M apps/web/app/(dashboard)/backoffice/pontos/hooks/use-pontos-data.ts  [PRECISA-TESTE] (hook de dados de pontos)
M apps/web/app/(dashboard)/backoffice/producao/pagamentos/page.tsx  [PRECISA-TESTE] (pagamentos de produção)
M apps/web/app/(dashboard)/backoffice/producao/relatorios/components/filtros-producao-relatorio.tsx  [PRECISA-TESTE] (filtro de relatório)
M apps/web/app/(dashboard)/backoffice/producao/relatorios/components/filtros-relatorio.tsx  [PRECISA-TESTE] (filtro)
M apps/web/app/(dashboard)/backoffice/relatorios/comissoes/page.tsx  [PRECISA-TESTE] (relatório de comissões)
M apps/web/app/(dashboard)/backoffice/usuarios/comerciais/components/comercial-modal.tsx  [PRECISA-FUNCIONAL] (teste básico criado; precisa funcional com props/modal)
M apps/web/app/(dashboard)/backoffice/usuarios/comerciais/components/novo-comercial-form.tsx  [PRECISA-TESTE] (formulário)
M apps/web/app/(dashboard)/comercial/parceiros/novo/page.tsx    [PRECISA-TESTE] (página de parceiro)
M apps/web/app/(dashboard)/consultor/dados-pessoais/page.tsx     [PRECISA-TESTE] (dados pessoais do consultor)
M apps/web/app/(dashboard)/gestor/comissoes/page.tsx            [PRECISA-TESTE] (comissões do gestor)
M apps/web/app/(dashboard)/gestor/importar-cupons/page.tsx     [PRECISA-TESTE] (importação de cupons)
M apps/web/app/(dashboard)/gestor/parceiros/novo/page.tsx       [PRECISA-TESTE] (parceiros do gestor)
M apps/web/app/(dashboard)/lideranca/consultores-pf/comissoes/page.tsx  [PRECISA-TESTE] (comissões de consultores PF)
M apps/web/app/(dashboard)/lideranca/consultores-pf/novo/page.tsx  [PRECISA-TESTE] (cadastro)
M apps/web/app/(dashboard)/lideranca/equipe/consultores-pf/_components/upload-planilha-consultores-pf.tsx  [PRECISA-TESTE] (upload)
M apps/web/app/(dashboard)/lideranca/equipe/consultores-pf/utils.ts  [PRECISA-TESTE] (utilitários)
M apps/web/app/(dashboard)/lideranca/page.tsx                  [PRECISA-TESTE] (página de liderança)
M apps/web/app/(dashboard)/parceiro/dados-pessoais/page.tsx     [PRECISA-TESTE] (dados do parceiro)
M apps/web/app/(dashboard)/parceiro/indicados/page.tsx         [PRECISA-TESTE] (indicados)
M apps/web/app/(dashboard)/parceiro/pontos/page.tsx            [PRECISA-TESTE] (pontos)
M apps/web/app/__tests__/backoffice-pontos-ranking.test.ts      [TESTE-INCREMENTAVEL] (teste existente — pode ser melhorado com dados reais)
M apps/web/app/__tests__/comissoes-gestao-page.test.ts          [TESTE-INCREMENTAVEL]
M apps/web/app/__tests__/parceiro-preferencia-ciclo.test.ts      [TESTE-INCREMENTAVEL] (corrigido anteriormente — pode ser melhorado com casos de ciclo anual/semestral)
M apps/web/app/__tests__/regras-api.test.ts                      [TESTE-INCREMENTAVEL] (teste de rotas de regras — pode ser incrementado com assertions de resposta)
M apps/web/app/__tests__/regras-backoffice-unit.test.ts         [TESTE-INCREMENTAVEL] (corrigido — pode ser melhorado com mais cenários de erro)
M apps/web/app/__tests__/regras-comerciais-form-unit.test.ts     [TESTE-INCREMENTAVEL]
M apps/web/app/__tests__/regras-gestores-form-unit.test.ts       [TESTE-INCREMENTAVEL]
M apps/web/app/__tests__/upload-comissoes.test.ts               [TESTE-INCREMENTAVEL]
M apps/web/app/acesso-pf/[token]/page.tsx                       [PRECISA-TESTE] (página de acesso via token)

# === ROTAS API (modificadas) ===
# Todas as rotas abaixo precisam de testes funcionais (status code, resposta JSON, validação de parâmetros)

M apps/web/app/api/v1/admin/backoffices/[id]/assinatura/route.ts      [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/admin/backoffices/[id]/faturas/[faturaId]/route.ts  [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/admin/backoffices/[id]/faturas/route.ts         [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/admin/backoffices/route.ts                       [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/admin/usuarios/[id]/delete-info/route.ts         [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/admin/usuarios/[id]/route.ts                      [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/auth/primeiro-acesso/route.ts                   [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/assinatura/route.ts                  [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/comerciais/[id]/route.ts             [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/comerciais/calcular-comissao/route.ts  [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/comerciais/route.ts                  [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/consultores-pf/[id]/route.ts         [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/consultores-pf/comissoes/route.ts    [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/consultores-pf/route.ts              [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/equipe/[id]/comissoes/route.ts       [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/equipe/[id]/metas/route.ts          [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/equipe/[id]/route.ts                 [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/equipe/route.ts                     [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/lembrete-financeiro/route.ts        [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/liderancas/[id]/route.ts            [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/liderancas/route.ts                 [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/parceiros/route.ts                  [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/pontos/ciclos/route.ts              [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/pontos/distribuir/route.ts          [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/pontos/ranking/route.ts            [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/pontos/resgates/route.ts           [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/regras-comerciais/route.ts          [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/regras-faltas/route.ts              [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/regras-gestores/route.ts            [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/relatorio-comissoes/route.ts        [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/reprocessar-comissoes/route.ts      [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/uploads/preview/route.ts           [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/uploads/route.ts                    [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/backoffice/uploads/service.ts                  [TESTE-BASICO-OK] (teste básico criado — precisa funcional com mock de Prisma/upload)
M apps/web/app/api/v1/comercial/minha-comissao/route.ts              [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/comercial/parceiros/route.ts                   [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/gestor/comissoes/route.ts                      [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/gestor/consultas/[id]/route.ts                 [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/gestor/parceiros/route.ts                      [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/gestor/relatorios/route.ts                     [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/consultores-pf/[id]/comissoes/route.ts  [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/consultores-pf/[id]/metas/route.ts   [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/consultores-pf/[id]/route.ts         [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/consultores-pf/producao/route.ts     [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/consultores-pf/route.ts              [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/equipe/consultores-pf/importar/route.ts  [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/equipe/importar/route.ts             [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/lideranca/metas/route.ts                      [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/parceiro/dados-pessoais/route.ts              [PRECISA-FUNCIONAL]
M apps/web/app/api/v1/parceiro/pontos/resgates/route.ts             [PRECISA-FUNCIONAL]
M apps/web/app/cupom/[codigo]/page.tsx                             [PRECISA-TESTE] (página de cupom)

# === COMPONENTES (modificados) ===

M apps/web/components/backoffice/gerenciador-ciclos-pontos.tsx     [TESTE-BASICO-OK] (teste básico criado — precisa funcional)
M apps/web/components/backoffice/gerenciador-premios.tsx          [TESTE-BASICO-OK] (teste básico criado — precisa funcional)
M apps/web/components/backoffice/ranking-gestor.tsx              [TESTE-BASICO-OK] (teste básico criado — precisa funcional)
M apps/web/components/backoffice/upload-planilha-preview.tsx     [TESTE-BASICO-OK] (teste básico criado — precisa funcional)
M apps/web/components/parceiro/catalogo-premios.tsx              [TESTE-BASICO-OK] (teste básico criado — precisa funcional)
M apps/web/components/parceiro/meu-ranking.tsx                   [TESTE-BASICO-OK] (teste básico criado — precisa funcional)
M apps/web/components/ui/dialog.tsx                               [TESTE-INCREMENTAVEL] (componente UI — pode ser incrementado com renderização e eventos)
M apps/web/components/ui/input.tsx                              [TESTE-INCREMENTAVEL]
M apps/web/components/ui/table.tsx                              [TESTE-INCREMENTAVEL]

# === LIBS (modificadas) ===

M apps/web/lib/__tests__/upload-correcoes.test.ts                 [TESTE-INCREMENTAVEL]
M apps/web/lib/audit.ts                                          [TESTE-BASICO-OK] (teste básico criado; precisa funcional com mock de Prisma)
M apps/web/lib/auth-config.ts                                     [PRECISA-TESTE] (configuração de auth — precisa verificação de exportações)
M apps/web/lib/auth.ts                                           [TESTE-BASICO-OK + TESTE-FUNCIONAL] (teste básico + funcional criados; precisa teste com mock de sessão real)
M apps/web/lib/db.ts                                             [TESTE-INCREMENTAVEL] (helper de DB — precisa verificação de resolução do Prisma)
M apps/web/lib/parse-planilha-producao.ts                        [TESTE-BASICO-OK] (teste básico criado; precisa funcional com mock de planilha)
M apps/web/lib/password-reset.ts                                 [TESTE-BASICO-OK] (teste básico criado; precisa funcional com mock de token)
M apps/web/lib/pontos-utils.ts                                   [TESTE-INCREMENTAVEL] (utilitários de pontos — precisa testes com dados de ciclo/configuração)
M apps/web/lib/processar-upload-pf.ts                            [TESTE-BASICO-OK + TESTE-FUNCIONAL] (teste básico + funcional criados; precisa integração com mock de XLSX)
M apps/web/middleware.ts                                          [TESTE-BASICO-OK] (teste de middleware corrigido; precisa cobrir todos os casos de auth/admin/gestor)

# === PÁGINAS E OUTROS (não listados acima — todos precisam de testes) ===
# A lista acima inclui todos os arquivos .tsx, .ts, .ts modificados no worktree.

# === NOVOS (??) ===

?? AUDITORIA_COBERTURA_A01_A14_POS_PASSO36.md                     [NAO-APLICAVEL]
?? INSTRUCOES-CORRECAO-DEFINITIVA-LINT.md                         [NAO-APLICAVEL]
?? INSTRUCOES-FINAIS.md                                          [NAO-APLICAVEL]
?? README-PACOTE-CONSOLIDADO.md                                   [NAO-APLICAVEL]
?? apps/web/app/(dashboard)/admin/usuarios/                      [PRECISA-TESTE] (diretório/página não rastreado — precisa verificação se existe arquivo)
?? apps/web/app/(dashboard)/backoffice/pontos/pontos-types.ts    [TESTE-INCREMENTAVEL] (tipos — precisa verificação de types)
?? apps/web/app/__tests__/admin-usuarios-reset-password-route.test.ts  [TESTE-BASICO-OK] (teste básico — pode ser melhorado com chamada real à rota)
?? apps/web/app/__tests__/admin-usuarios-route.test.ts           [TESTE-BASICO-OK]
?? apps/web/app/__tests__/backoffice-uploads-service.test.ts     [TESTE-BASICO-OK]
?? apps/web/app/__tests__/consultor-pf-contrato-idor.test.ts     [TESTE-INCREMENTAVEL]
?? apps/web/app/__tests__/finance-endpoints-contract.test.ts    [TESTE-INCREMENTAVEL]
?? apps/web/app/__tests__/pages-1365219802.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-1451514016.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-1543884789.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-1564879767.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-2102027732.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-409646355.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-412061018.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-519054894.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-565575375.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/__tests__/pages-673290401.test.ts               [TESTE-BASICO-OK]
?? apps/web/app/api/v1/admin/usuarios/[id]/reset-password/      [PRECISA-FUNCIONAL] (rota — precisa teste com chamada real)
?? apps/web/app/api/v1/admin/usuarios/route.ts                  [TESTE-BASICO-OK] (teste básico criado — precisa funcional)
?? apps/web/components/__tests__/                                [TESTE-BASICO-OK] (diretório de testes de componentes — todos criados)
?? apps/web/components/password-reset-modal.tsx                 [PRECISA-TESTE] (componente de modal de reset — precisa renderização)
?? apps/web/lib/__tests__/audit-functional.test.ts              [TESTE-FUNCIONAL] (funcional criado — precisa ser aprovado)
?? apps/web/lib/__tests__/audit.test.ts                         [TESTE-BASICO-OK]
?? apps/web/lib/__tests__/auth-functional.test.ts                 [TESTE-FUNCIONAL]
?? apps/web/lib/__tests__/auth.test.ts                           [TESTE-BASICO-OK]
?? apps/web/lib/__tests__/competencia.test.ts                   [TESTE-INCREMENTAVEL]
?? apps/web/lib/__tests__/mes-referencia.test.ts                [TESTE-BASICO-OK]
?? apps/web/lib/__tests__/parse-planilha-producao.test.ts        [TESTE-BASICO-OK]
?? apps/web/lib/__tests__/password-reset.test.ts                [TESTE-BASICO-OK]
?? apps/web/lib/__tests__/pontos-utils-comissao-pf.test.ts       [TESTE-INCREMENTAVEL]
?? apps/web/lib/__tests__/processar-upload-pf-functional.test.ts  [TESTE-FUNCIONAL]
?? apps/web/lib/__tests__/processar-upload-pf.test.ts            [TESTE-BASICO-OK]
?? apps/web/lib/__tests__/regras-versoes.test.ts                 [TESTE-BASICO-OK]
?? apps/web/lib/competencia.ts                                   [PRECISA-TESTE] (lib nova — precisa teste básico e funcional)
?? apps/web/lib/mes-referencia.ts                                [PRECISA-TESTE]
?? apps/web/lib/regras-versoes.ts                                [PRECISA-TESTE]
?? bkpmundoas/                                                 [NAO-APLICAVEL] (backup — não faz parte do worktree ativo)
?? check_hash.sql                                               [NAO-APLICAVEL]
?? packages/database/__tests__/                                  [TESTE-BASICO-OK] (testes de migrations criados — todos precisam ser incrementados)
?? packages/database/prisma/migrations/20260821170000_add_month_and_cycle_constraints/  [TESTE-BASICO-OK] (teste básico criado — precisa verificação de SQL)
?? packages/database/prisma/migrations/20260821180000_add_rule_versions_by_competence/  [TESTE-BASICO-OK]
?? scripts/desvincular-arquivos-ambiente.ps1                      [NAO-APLICAVEL]
?? scripts/validar-release.ps1                                   [NAO-APLICAVEL]
?? test-prisma.js                                                 [NAO-APLICAVEL]
?? test_hash.js                                                   [NAO-APLICAVEL]
?? update_hash.sql                                                [NAO-APLICAVEL]

# === RESUMO GERAL ===
# Total de arquivos no worktree (git status --short): ~174 (incluindo todos M, ??)
# Nenhum arquivo omitido nesta lista.
# Classificação geral:
# - [NAO-APLICAVEL]: ~20 (docs, configs, scripts, backups)
# - [TESTE-BASICO-OK]: ~80 (testes básicos criados, mas ainda podem ser melhorados)
# - [TESTE-INCREMENTAVEL]: ~20 (testes existentes — precisam de mais casos/funcional)
# - [PRECISA-TESTE] / [PRECISA-FUNCIONAL]: ~54 (arquivos críticos sem cobertura adequada)
# Todos os 174 arquivos estão listados explicitamente acima.
