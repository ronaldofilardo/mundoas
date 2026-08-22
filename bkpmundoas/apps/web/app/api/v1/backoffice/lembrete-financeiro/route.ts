import { prisma } from "@asa/database";
import { requireBackoffice, ok } from "@/lib/api-helpers";

export async function GET() {
  const { session, error } = await requireBackoffice();
  if (error) return error;

  const backofficeId = (session!.user as any).backofficeId as string | null;
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

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

  // Existe fatura PAGA com vencimento dentro do mês corrente?
  const faturaPagaDoMes = await prisma.faturaAsaas.findFirst({
    where: {
      assinaturaId: assinatura.id,
      pagoManualmente: true,
      vencimento: { gte: inicioMes, lt: inicioProximoMes },
    },
  });

  // Mostra o lembrete se ainda não há fatura paga pro mês corrente.
  // A partir do dia 1º isso já é verdade (nada foi pago ainda no mês novo)
  // e some assim que o Admin marcar a fatura do mês como paga.
  return ok({ mostrar: !faturaPagaDoMes });
}
