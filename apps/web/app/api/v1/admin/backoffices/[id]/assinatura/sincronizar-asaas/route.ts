import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireAdmin, badRequest, notFound, ok } from "@/lib/api-helpers";

// POST: busca no Asaas as cobranças da assinatura da unidade e sincroniza
// com a tabela local faturas_asaas. Útil para unidades cuja fatura foi
// gerada antes do checkout passar a salvá-la localmente, ou para casos em
// que o webhook não chegou (ex.: sandbox instável, URL do webhook trocada).
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
  if (!assinatura.asaasSubscriptionId) {
    return badRequest("Esta unidade ainda não tem assinatura criada no Asaas.");
  }

  const BASE_URL =
    process.env.ASAAS_SANDBOX === "true"
      ? "https://sandbox.asaas.com/api/v3"
      : "https://api.asaas.com/v3";

  const res = await fetch(
    `${BASE_URL}/payments?subscription=${assinatura.asaasSubscriptionId}&limit=20`,
    { headers: { access_token: process.env.ASAAS_API_KEY ?? "" } },
  );

  if (!res.ok) {
    return badRequest("Não foi possível consultar as cobranças no Asaas.");
  }

  const { data: pagamentos } = (await res.json()) as {
    data: Array<{
      id: string;
      value: number;
      dueDate: string;
      status: string;
      invoiceUrl?: string;
      bankSlipUrl?: string;
    }>;
  };

  const STATUS_MAP: Record<string, string> = {
    PENDING: "PENDING",
    RECEIVED: "RECEIVED",
    CONFIRMED: "CONFIRMED",
    OVERDUE: "OVERDUE",
    REFUNDED: "REFUNDED",
    DELETED: "DELETED",
  };

  for (const pagamento of pagamentos) {
    await prisma.faturaAsaas.upsert({
      where: { asaasPaymentId: pagamento.id },
      create: {
        assinaturaId: assinatura.id,
        asaasPaymentId: pagamento.id,
        valor: pagamento.value,
        vencimento: new Date(pagamento.dueDate),
        statusPagamento: (STATUS_MAP[pagamento.status] ?? "PENDING") as never,
        linkFatura: pagamento.invoiceUrl,
        linkBoleto: pagamento.bankSlipUrl,
      },
      update: {
        statusPagamento: (STATUS_MAP[pagamento.status] ?? "PENDING") as never,
        linkFatura: pagamento.invoiceUrl,
        linkBoleto: pagamento.bankSlipUrl,
      },
    });
  }

  return ok({ sincronizadas: pagamentos.length });
}
