import type { Assinatura } from "./types";

// Retorna o índice da etapa atual do onboarding (0-3) ou -1 quando a
// assinatura está fora do fluxo (cortesia legada, cancelada, etc.).
export function etapaAtualOnboarding(a: Assinatura): number {
  if (a.statusAssinatura === "PENDENTE_TERMOS") return a.termosAceitosEm ? 1 : 0;
  if (a.statusAssinatura === "PENDENTE_PAGAMENTO") return a.asaasSubscriptionId ? 2 : 1;
  if (a.statusAssinatura === "ATIVA") return 3;
  return -1;
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
