import { prisma } from "@/lib/db";
import { requireBackoffice, notFound, ok } from "@/lib/api-helpers";
import { garantirLinkFaturaAsaas } from "@/lib/asaas/fatura-link";

export async function GET() {
  const { session, error } = await requireBackoffice();
  if (error) return error;

  const backofficeId = session!.user.backofficeId ?? null;
  if (!backofficeId) {
    return notFound("Unidade não encontrada para este usuário.");
  }

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId },
    include: {
      backoffice: {
        select: {
          id: true,
          nome: true,
          razaoSocial: true,
          cpf: true,
          cnpj: true,
          telefone: true,
          usuario: { select: { email: true } },
        },
      },
      faturas: {
        orderBy: { vencimento: "desc" },
        take: 24, // últimos ~2 anos, evita retorno gigante
      },
    },
  });

  if (!assinatura) {
    return ok({ semAssinatura: true });
  }

  // Garante que qualquer fatura pendente possua link de pagamento no Asaas
  const backoffice = (assinatura as { backoffice?: any }).backoffice ?? null;
  const faturas = await Promise.all(
    assinatura.faturas.map(async (f) => {
      let linkFatura = f.linkFatura;
      let linkBoleto = f.linkBoleto;

      if (!f.pagoManualmente && !["CONFIRMED", "RECEIVED"].includes(f.statusPagamento) && !linkFatura) {
        linkFatura = await garantirLinkFaturaAsaas(f.id, {
          fatura: f,
          assinaturaId: assinatura.id,
          asaasCustomerId: assinatura.asaasCustomerId,
          backoffice,
        });
      }

      return {
        id: f.id,
        valor: f.valor,
        vencimento: f.vencimento,
        statusPagamento: f.statusPagamento,
        pago: f.pagoManualmente || ["CONFIRMED", "RECEIVED"].includes(f.statusPagamento),
        pagoEm: f.pagoEm,
        linkFatura,
        linkBoleto,
      };
    }),
  );

  // Somente os campos relevantes pra unidade ver — não expõe IDs internos
  // do Asaas nem quem bloqueou/liberou (informação interna do Admin).
  return ok({
    semAssinatura: false,
    statusAssinatura: assinatura.statusAssinatura,
    planoAssinatura: assinatura.planoAssinatura,
    metodoPagamento: assinatura.faturas[0]?.formaPagamento ?? null,
    motivoBloqueio:
      assinatura.statusAssinatura === "BLOQUEADA_MANUAL"
        ? assinatura.motivoBloqueio
        : undefined,
    cortesiaExpiraEm: assinatura.cortesiaExpiraEm,
    faturas,
  });
}
