import { prisma } from "@asa/database";
import { requireBackoffice, ok } from "@/lib/api-helpers";

export async function GET() {
  const { session, error } = await requireBackoffice();
  if (error) return error;

  const backofficeId = session!.user.backofficeId ?? null;
  if (!backofficeId) {
    return ok({ mostrar: false });
  }

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId },
    select: { id: true },
  });

  if (!assinatura) {
    return ok({ mostrar: false });
  }

  // Mostra o lembrete (💳) enquanto existir qualquer fatura com
  // status "Pendente" — a mesma condição exibida na coluna Status
  // da página /backoffice/financeiro (pagoManualmente === false).
  const faturaPendente = await prisma.faturaAsaas.findFirst({
    where: {
      assinaturaId: assinatura.id,
      pagoManualmente: false,
    },
    select: { id: true },
  });

  return ok({ mostrar: Boolean(faturaPendente) });
}
