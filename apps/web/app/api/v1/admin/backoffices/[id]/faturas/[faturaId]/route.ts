import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireAdmin, badRequest, notFound, ok } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; faturaId: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { pago } = body as { pago?: boolean };

    if (typeof pago !== "boolean") {
      return badRequest("Informe { pago: true } ou { pago: false }.");
    }

    const fatura = await prisma.faturaAsaas.findUnique({
      where: { id: params.faturaId },
      include: { assinatura: true },
    });
    if (!fatura || fatura.assinatura.backofficeId !== params.id) {
      return notFound("Fatura não encontrada para esta unidade.");
    }

    const atualizada = await prisma.$transaction(async (tx) => {
      const faturaAtualizada = await tx.faturaAsaas.update({
        where: { id: params.faturaId },
        data: {
          pagoManualmente: pago,
          statusPagamento: pago ? "CONFIRMED" : "PENDING",
          pagoEm: pago ? new Date() : null,
          marcadoPagoPorUsuarioId: pago ? session!.user.id : null,
          marcadoPagoEm: pago ? new Date() : null,
        },
      });

      // Se marcou como paga e a unidade estava inadimplente por essa fatura,
      // volta pra ATIVA (sem sobrescrever bloqueio manual nem cortesia).
      if (pago) {
        const assinatura = await tx.assinatura.findUnique({
          where: { id: fatura.assinaturaId },
        });
        if (assinatura?.statusAssinatura === "INADIMPLENTE") {
          await tx.assinatura.update({
            where: { id: fatura.assinaturaId },
            data: { statusAssinatura: "ATIVA" },
          });
        }
      }

      return faturaAtualizada;
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: pago ? "FATURA_MARCAR_PAGA" : "FATURA_MARCAR_NAO_PAGA",
      entidade: "fatura_asaas",
      entidadeId: params.faturaId,
      detalhes: { backofficeId: params.id },
    });

    return ok(atualizada);
  } catch (err: any) {
    console.error("[admin/backoffices/[id]/faturas/[faturaId]] Erro:", err);
    return badRequest(err?.message || "Erro interno ao atualizar fatura.");
  }
}
