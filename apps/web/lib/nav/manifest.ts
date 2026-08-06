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
            label: "Equipe",
            href: "/backoffice/comissionamento/equipe",
            icon: "users",
          },
          {
            label: "Metas & Produção",
            href: "/backoffice/comissionamento?tab=comerciais",
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
          { label: "Procedimentos", href: "/backoffice/producao/procedimentos", icon: "procedures" },
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
        links: [],
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
          { label: "Comissões", href: "/parceiro/comissoes", icon: "commissions" },
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
          { label: "Consultores PF", href: "/lideranca/consultores-pf", icon: "users" },
          { label: "Produção", href: "/lideranca/consultores-pf/producao", icon: "production" },
          { label: "Metas & Produção", href: "/lideranca/metas", icon: "goals" },
        ],
      },
    ],
  },
};

/** Lista ordenada usada quando o perfil não é identificado. */
export const DEFAULT_PROFILE_ID = "backoffice";
