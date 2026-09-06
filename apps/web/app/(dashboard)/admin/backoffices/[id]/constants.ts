export const STATUS_LABEL: Record<string, string> = {
  PENDENTE_TERMOS: "Onboarding: aguardando aceite dos termos",
  PENDENTE_PAGAMENTO: "Onboarding: aguardando pagamento",
  ATIVA: "Ativa",
  INADIMPLENTE: "Inadimplente",
  BLOQUEADA_MANUAL: "Bloqueada manualmente",
  CORTESIA: "Cortesia",
  CANCELADA: "Cancelada",
};

export const STATUS_COLOR: Record<string, string> = {
  PENDENTE_TERMOS: "bg-amber-100 text-amber-800",
  PENDENTE_PAGAMENTO: "bg-amber-100 text-amber-800",
  ATIVA: "bg-green-100 text-green-800",
  INADIMPLENTE: "bg-red-100 text-red-800",
  BLOQUEADA_MANUAL: "bg-neutral-200 text-neutral-800",
  CORTESIA: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-neutral-200 text-neutral-600",
};

// Etapas do onboarding (Plano de Implementação mundoAS), para a barra de
// progresso visual no admin. Estados fora do fluxo de onboarding (ATIVA por
// cortesia legada, CANCELADA, etc.) simplesmente não renderizam a barra.
export const ETAPAS_ONBOARDING = [
  { key: "SENHA", label: "Primeiro acesso" },
  { key: "TERMOS", label: "Aceite dos termos" },
  { key: "PAGAMENTO", label: "Plano e pagamento" },
  { key: "ATIVA", label: "Ativa" },
] as const;

export const PLANO_LABEL: Record<string, string> = {
  MENSAL: "Mensal (R$ 350/mês)",
  ANUAL: "Anual (R$ 3.500/ano)",
};
