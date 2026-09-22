import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, badRequest, notFound, ok } from "@/lib/api-helpers";

type PagamentoAsaas = {
  id: string;
  value: number;
  dueDate: string;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  paidDate?: string | null;
};

const STATUS_MAP: Record<string, string> = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  CONFIRMED: "CONFIRMED",
  OVERDUE: "OVERDUE",
  REFUNDED: "REFUNDED",
  DELETED: "DELETED",
};

function ehStatusPago(status: string): boolean {
  return status === "RECEIVED" || status === "CONFIRMED";
}

// POST: busca no Asaas as cobranças da unidade e sincroniza com a tabela
// local faturas_asaas. Cobre dois cenários de webhook perdido:
// 1) mensalidades da assinatura (?subscription=);
// 2) faturas avulsas do backoffice (?externalReference=backofficeId).
// Útil quando o webhook não chegou (sandbox instável, URL trocada, etc.).
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId: params.id },
  });
  if (!assinatura) return notFound("Assinatura não encontrada para esta unidade.");

  const BASE_URL =
    process.env.ASAAS_SANDBOX === "true"
      ? "https://sandbox.asaas.com/api/v3"
      : "https://api.asaas.com/v3";

  const headers = { access_token: process.env.ASAAS_API_KEY ?? "" };
  const pagamentosPorId = new Map<string, PagamentoAsaas>();

  // 1) Cobranças de assinatura (mensalidades), quando existir subscription
  if (assinatura.asaasSubscriptionId) {
    const res = await fetch(
      `${BASE_URL}/payments?subscription=${assinatura.asaasSubscriptionId}&limit=50`,
      { headers },
    );
    if (!res.ok) {
      return badRequest("Não foi possível consultar as cobranças no Asaas.");
    }
    const { data } = (await res.json()) as { data?: PagamentoAsaas[] };
    for (const pagamento of data ?? []) {
      pagamentosPorId.set(pagamento.id, pagamento);
    }
  }

  // 2) Cobranças avulsas da unidade (externalReference = backofficeId).
  // Também pega mensalidades com o mesmo externalReference — dedup por id.
  const resAvulsa = await fetch(
    `${BASE_URL}/payments?externalReference=${encodeURIComponent(params.id)}&limit=50`,
    { headers },
  );
  if (resAvulsa.ok) {
    const { data } = (await resAvulsa.json()) as { data?: PagamentoAsaas[] };
    for (const pagamento of data ?? []) {
      pagamentosPorId.set(pagamento.id, pagamento);
    }
  } else if (pagamentosPorId.size === 0) {
    return badRequest("Não foi possível consultar as cobranças no Asaas.");
  }

  const pagamentos = [...pagamentosPorId.values()];
  let baixas = 0;

  for (const pagamento of pagamentos) {
    const status = (STATUS_MAP[pagamento.status] ?? "PENDING") as never;
    const pago = ehStatusPago(pagamento.status);
    if (pago) baixas += 1;

    await prisma.faturaAsaas.upsert({
      where: { asaasPaymentId: pagamento.id },
      create: {
        assinaturaId: assinatura.id,
        asaasPaymentId: pagamento.id,
        valor: pagamento.value,
        vencimento: new Date(pagamento.dueDate),
        statusPagamento: status,
        linkFatura: pagamento.invoiceUrl,
        linkBoleto: pagamento.bankSlipUrl,
        ...(pago ? { pagoEm: pagamento.paidDate ? new Date(pagamento.paidDate) : new Date() } : {}),
      },
      update: {
        statusPagamento: status,
        linkFatura: pagamento.invoiceUrl,
        linkBoleto: pagamento.bankSlipUrl,
        ...(pago ? { pagoEm: pagamento.paidDate ? new Date(pagamento.paidDate) : new Date() } : {}),
      },
    });
  }

  return ok({ sincronizadas: pagamentos.length, baixas });
}
