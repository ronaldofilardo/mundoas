export interface Fatura {
  id: string;
  valor: number;
  vencimento: string;
  statusPagamento: string;
  pagoManualmente: boolean;
  pagoEm: string | null;
  marcadoPagoEm?: string | null;
  marcadoPagoPorUsuarioId?: string | null;
  formaPagamento?: string | null;
  asaasPaymentId?: string | null;
  linkFatura?: string | null;
  linkBoleto?: string | null;
  criadoEm?: string;
}

export type StatusAssinatura =
  | "PENDENTE_TERMOS"
  | "PENDENTE_PAGAMENTO"
  | "ATIVA"
  | "INADIMPLENTE"
  | "BLOQUEADA_MANUAL"
  | "CORTESIA"
  | "CANCELADA";

export type PlanoAssinatura = "MENSAL" | "ANUAL";

export interface Assinatura {
  id: string;
  statusAssinatura: StatusAssinatura;
  motivoBloqueio: string | null;
  bloqueadoEm: string | null;
  motivoCortesia: string | null;
  cortesiaDesde: string | null;
  cortesiaExpiraEm: string | null;
  // Onboarding mundoAS
  termosAceitosEm: string | null;
  termosVersao: string | null;
  planoAssinatura: PlanoAssinatura | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  backoffice: { nome: string; cpf: string };
}

export interface NovaFaturaInput {
  valor: string;
  vencimento: string;
  jaPago: boolean;
  formaPagamento: "" | "BOLETO" | "PIX";
}
