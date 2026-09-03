import type { NavProfile } from "./types";

/**
 * Fonte única de verdade para a navegação do produto.
 * Para adicionar uma rota: incluir no grupo do perfil correto.
 * Para desativar: remover do manifesto (não hardcodar no componente).
 */
export const NAV_PROFILES: Record<string, NavProfile> = {
  backoffice: {
    id: "backoffice",
    label: "Backoffice",
    description: "Operação comercial · Acesso Saúde",
    home: "/backoffice/dashboard",
    groups: [
      {
        title: "Visão geral",
        links: [
          { label: "Dashboard", href: "/backoffice/dashboard", icon: "dashboard" },
        ],
      },
      {
        title: "Comissionamento",
        links: [
          {
            label: "Metas & Produção",
            href: "/backoffice/comissionamento/equipe?tab=metas",
            icon: "goals",
          },
          {
            label: "Painel Metas de Vendas",
            href: "/backoffice/metas-vendas",
            icon: "goals",
          },
          {
            label: "Pagamentos",
            href: "/backoffice/comissionamento/pagamentos",
            icon: "payments",
          },
        ],
      },
      {
        title: "Produção",
        links: [
          { label: "Upload de planilha", href: "/backoffice/producao?tab=upload", icon: "upload" },
          { label: "Relatórios", href: "/backoffice/producao/relatorios", icon: "reports" },
        ],
      },
      {
        title: "Pontos",
        links: [
          { label: "Ciclos e prêmios", href: "/backoffice/pontos", icon: "points" },
        ],
      },
      {
        title: "Conta",
        links: [
          { label: "Financeiro", href: "/backoffice/financeiro", icon: "payments" },
        ],
      },
    ],
  },

  gestor: {
    id: "gestor",
    label: "Gestão",
    description: "Equipe · Acesso Saúde",
    home: "/gestor/dashboard",
    groups: [
      {
        title: "Visão geral",
        links: [
          { label: "Dashboard", href: "/gestor/dashboard", icon: "dashboard" },
        ],
      },
      {
        title: "Equipe",
        links: [
          { label: "Consultores", href: "/gestor/consultores", icon: "users" },
          { label: "Usuários", href: "/gestor/usuarios", icon: "users" },
        ],
      },
      {
        title: "Operação",
        links: [
          { label: "Produção", href: "/gestor/producao", icon: "production" },
          { label: "Comissões", href: "/gestor/comissoes", icon: "commissions" },
          { label: "Auditoria", href: "/gestor/auditoria", icon: "audit" },
        ],
      },
      {
        title: "Conta",
        links: [
          { label: "Dados pessoais", href: "/gestor/dados-pessoais", icon: "profile" },
        ],
      },
    ],
  },

  comercial: {
    id: "comercial",
    label: "Comercial",
    description: "Performance · Acesso Saúde",
    home: "/comercial/minha-comissao",
    groups: [
      {
        title: "Performance",
        links: [
          { label: "Minha comissão", href: "/comercial/minha-comissao", icon: "commissions" },
          { label: "Minhas metas", href: "/comercial/minhas-metas", icon: "goals" },
          { label: "Parceiros", href: "/comercial/parceiros", icon: "partners" },
        ],
      },
      {
        title: "Conta",
        links: [
          { label: "Dados pessoais", href: "/comercial/dados-pessoais", icon: "profile" },
        ],
      },
    ],
  },

  consultor: {
    id: "consultor",
    label: "Consultor",
    description: "Acesso Saúde",
    home: "/consultor/bonus",
    groups: [
      {
        title: "Operação",
        links: [
          { label: "Bônus", href: "/consultor/bonus", icon: "points" },
        ],
      },
    ],
  },

  parceiro: {
    id: "parceiro",
    label: "Parceiro",
    description: "Indicações · Acesso Saúde",
    home: "/parceiro/indicados",
    groups: [
      {
        title: "Indicações",
        links: [
          { label: "Cadastrar cliente", href: "/parceiro/indicados", icon: "referrals" },
          { label: "Pontos", href: "/parceiro/pontos", icon: "points" },
        ],
      },
      {
        title: "Conta",
        links: [
          { label: "Dados pessoais", href: "/parceiro/dados-pessoais", icon: "profile" },
        ],
      },
    ],
  },

  lideranca: {
    id: "lideranca",
    label: "Liderança",
    description: "Equipe · Acesso Saúde",
    home: "/lideranca",
    groups: [
      {
        title: "Equipe",
        links: [
          { label: "Visão geral", href: "/lideranca", icon: "dashboard" },
          { label: "Produção", href: "/lideranca/consultores-pf/producao", icon: "production" },
          { label: "Metas & Produção", href: "/lideranca/metas", icon: "goals" },
        ],
      },
    ],
  },

  

  admin: {
    id: "admin",
    label: "Administrador",
    description: "Plataforma · Acesso Saúde",
    home: "/admin/usuarios",
    groups: [
      {
        title: "Plataforma",
        links: [
          { label: "Usuários", href: "/admin/usuarios", icon: "users" },
          { label: "Unidades", href: "/admin/backoffices", icon: "establishment" },
          { label: "Financeiro", href: "/admin/financeiro", icon: "payments" },
        ],
      },
    ],
  },
};

/** Lista ordenada usada quando o perfil não é identificado. */
export const DEFAULT_PROFILE_ID = "consultor";
