import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, badRequest, notFound, ok } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { reenviarNotificacaoCobranca } from "@/lib/asaas/client";
import { garantirLinkFaturaAsaas } from "@/lib/asaas/fatura-link";
import { isFaturaAtrasada15Dias, isFaturaPaga, calcularDiasAtraso } from "@/lib/billing/inadimplencia";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; faturaId: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const fatura = await prisma.faturaAsaas.findUnique({
      where: { id: params.faturaId },
      include: {
        assinatura: {
          include: {
            backoffice: true,
          },
        },
      },
    });

    if (!fatura || fatura.assinatura.backofficeId !== params.id) {
      return notFound("Fatura não encontrada para esta unidade.");
    }

    if (isFaturaPaga(fatura)) {
      return badRequest("Esta fatura já consta como paga e não pode ser reenviada.");
    }

    const atrasada15Dias = isFaturaAtrasada15Dias(fatura);
    if (!atrasada15Dias) {
      const diasAtraso = calcularDiasAtraso(fatura.vencimento);
      return badRequest(
        `O reenvio de cobrança é permitido apenas para faturas com 15 dias ou mais de atraso. (Atraso atual: ${diasAtraso} dias).`,
      );
    }

    // Garante que o link do Asaas esteja disponível
    let linkPagamento = fatura.linkFatura || fatura.linkBoleto;
    if (!linkPagamento || !fatura.asaasPaymentId) {
      const resultado = await garantirLinkFaturaAsaas(fatura.id);
      linkPagamento = resultado.link;
      if (!linkPagamento && resultado.error) {
        console.warn("[reenviar] Falha ao obter link Asaas:", resultado.error);
      }
    }

    // Se houver cobrança no Asaas, aciona a API de reenvio de notificações
    let notificacaoAsaasDisparada = false;
    if (fatura.asaasPaymentId) {
      notificacaoAsaasDisparada = await reenviarNotificacaoCobranca(fatura.asaasPaymentId);
    }

    const valorFormatado = Number(fatura.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const mensagemWhatsapp = `Olá, ${fatura.assinatura.backoffice.nome}! Identificamos que a mensalidade mundoAS no valor de ${valorFormatado} está com mais de 15 dias de atraso. Segue o link para regularização imediata do acesso: ${linkPagamento || ""}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsapp)}`;

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "FATURA_REENVIADA",
      entidade: "fatura_asaas",
      entidadeId: params.faturaId,
      detalhes: {
        backofficeId: params.id,
        valor: Number(fatura.valor),
        notificacaoAsaasDisparada,
      },
    });

    const faturaAtualizada = await prisma.faturaAsaas.findUnique({
      where: { id: params.faturaId },
    });

    return ok({
      success: true,
      mensagem: "Cobrança reenviada com sucesso.",
      notificacaoAsaasDisparada,
      linkPagamento,
      mensagemWhatsapp,
      whatsappUrl,
      fatura: faturaAtualizada,
    });
  } catch (err: unknown) {
    console.error("[admin/backoffices/[id]/faturas/[faturaId]/reenviar] Erro:", err);
    return badRequest(
      err instanceof Error ? err.message : "Erro interno ao reenviar fatura.",
    );
  }
}
