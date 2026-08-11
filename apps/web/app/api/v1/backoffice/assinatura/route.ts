import { prisma } from "@asa/database";
import { requireBackoffice, notFound, ok } from "@/lib/api-helpers";

export async function GET() {
  const { session, error } = await requireBackoffice();
  if (error) return error;

  const backofficeId = (session!.user as any).backofficeId as string | null;
  if (!backofficeId) {
    return notFound("Unidade não encontrada para este usuário.");
  }

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId },
    include: {
      faturas: {
        orderBy: { vencimento: "desc" },
        take: 24, // últimos ~2 anos, evita retorno gigante
      },
    },
  });

  if (!assinatura) {
    return ok({ semAssinatura: true });
  }

  // Somente os campos relevantes pra unidade ver — não expõe IDs internos
  // do Asaas nem quem bloqueou/liberou (informação interna do Admin).
  return ok({
    semAssinatura: false,
    statusAssinatura: assinatura.statusAssinatura,
    motivoBloqueio:
      assinatura.statusAssinatura === "BLOQUEADA_MANUAL"
        ? assinatura.motivoBloqueio
        : undefined,
    cortesiaExpiraEm: assinatura.cortesiaExpiraEm,
    faturas: assinatura.faturas.map((f) => ({
      id: f.id,
      valor: f.valor,
      vencimento: f.vencimento,
      statusPagamento: f.statusPagamento,
      pago: f.pagoManualmente,
      pagoEm: f.pagoEm,
    })),
  });
}
