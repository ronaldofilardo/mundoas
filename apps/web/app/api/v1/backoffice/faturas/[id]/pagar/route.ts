import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBackoffice, notFound, badRequest } from "@/lib/api-helpers";
import { garantirLinkFaturaAsaas } from "@/lib/asaas/fatura-link";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, error } = await requireBackoffice();
  if (error) return error;

  const backofficeId = session!.user.backofficeId;
  if (!backofficeId) {
    return notFound("Unidade não encontrada.");
  }

  const fatura = await prisma.faturaAsaas.findUnique({
    where: { id: params.id },
    include: { assinatura: true },
  });

  if (!fatura || fatura.assinatura.backofficeId !== backofficeId) {
    return notFound("Fatura não encontrada.");
  }

  if (fatura.pagoManualmente || ["CONFIRMED", "RECEIVED"].includes(fatura.statusPagamento)) {
    return badRequest("Esta fatura já foi paga.");
  }

  const { link, error: linkError } = await garantirLinkFaturaAsaas(fatura.id);

  if (!link) {
    console.error("[backoffice/faturas/pagar] Sem link:", {
      faturaId: fatura.id,
      asaasPaymentId: fatura.asaasPaymentId,
      linkError,
    });
    return badRequest(
      linkError
        ? `Não foi possível obter o link de pagamento do Asaas no momento: ${linkError}`
        : "Não foi possível obter o link de pagamento do Asaas no momento.",
    );
  }

  return NextResponse.redirect(link);
}
