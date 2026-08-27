# Padrão visual da aba Bônus do Consultor PF

A aba `Bônus` em `/backoffice/comissionamento/equipe?tab=bonus` foi alinhada ao padrão visual de `/backoffice/pontos`.

A implementação agora usa o mesmo tratamento de conteúdo com título `text-xl`, descrição auxiliar, cards com borda cinza, fundo neutro para informações administrativas, campos compactos com `rounded-lg`, botões primários `primary-600`, ações secundárias em azul e ações destrutivas em vermelho. Os ciclos deixaram de ser apresentados em tabela e passaram a usar cards empilhados, seguindo a composição usada por `CiclosPontos`.

O formulário utiliza campos `date`, mantém a criação e edição de ciclos e não exibe o campo de início do resgate. O resgate começa automaticamente no primeiro dia do ciclo, conforme a regra funcional já adotada. A configuração vigente continua sendo apenas informativa e é carregada da mesma configuração geral de Pontos.

As ações de salvar, excluir e resetar exibem feedback por `toast`, além de manter a mensagem textual para compatibilidade com os fluxos existentes. O reset administrativo continua auditável e preserva o extrato.

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `apps/web/app/(dashboard)/backoffice/metas-vendas/components/bonus-consultor-pf.tsx` | Reestruturação visual da aba Bônus, estados de carregamento das ações, feedback e campos de ciclo. |
| `apps/web/app/__tests__/bonus-consultor-pf-regression.test.ts` | Cobertura do design pattern, cores, cards, campos `date`, feedback e remoção de estilos antigos. |

## Validação

O teste direcionado foi aprovado com **1 arquivo e 10 testes**. A checagem TypeScript do app web também foi concluída sem erros.

O overlay deve ser descompactado diretamente na raiz do projeto, preservando os caminhos internos.
