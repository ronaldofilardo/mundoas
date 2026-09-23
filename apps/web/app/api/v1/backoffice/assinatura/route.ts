import { prisma } from "@/lib/db";
import { requireBackoffice, notFound, ok } from "@/lib/api-helpers";
import { garantirLinkFaturaAsaas } from "@/lib/asaas/fatura-link";
import { sincronizarStatusComAsaas } from "@/lib/asaas/sync-pull";

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

  // Fallback do webhook: se o evento de pagamento não chegou (401), puxa
  // o status real no Asaas antes de responder.
  const faturasSincronizadas = await sincronizarStatusComAsaas(assinatura.faturas);

  // Garante que qualquer fatura pendente possua link de pagamento no Asaas
  const backoffice = (assinatura as { backoffice?: any }).backoffice ?? null;
  const faturas = await Promise.all(
    faturasSincronizadas.map(async (f) => {
      let linkFatura = f.linkFatura;
      const linkBoleto = f.linkBoleto;

      if (!f.pagoManualmente && !["CONFIRMED", "RECEIVED"].includes(f.statusPagamento) && !linkFatura) {
        const resultado = await garantirLinkFaturaAsaas(f.id, {
          fatura: f,
          assinaturaId: assinatura.id,
          asaasCustomerId: assinatura.asaasCustomerId,
          backoffice,
        });
        linkFatura = resultado.link;
        if (!linkFatura && resultado.error) {
          console.warn("[backoffice/assinatura] Falha ao obter link Asaas:", {
            faturaId: f.id,
            error: resultado.error,
          });
        }
      }

      return {
        id: f.id,
        valor: f.valor,
        vencimento: f.vencimento,
        statusPagamento: f.statusPagamento,
        pago: f.pagoManualmente || ["CONFIRMED", "RECEIVED"].includes(f.statusPagamento),
        pagoEm: f.pagoEm,
        marcadoPagoEm: f.marcadoPagoEm ?? null,
        formaPagamento: f.formaPagamento ?? null,
        pagoManualmente: Boolean(f.pagoManualmente),
        origemPagamento: f.pagoManualmente
          ? "Baixa manual"
          : ["CONFIRMED", "RECEIVED"].includes(f.statusPagamento)
            ? f.asaasPaymentId
              ? "Asaas"
              : "Pagamento registrado"
            : "—",
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
    termosAceitosEm: assinatura.termosAceitosEm ?? null,
    termosVersao: assinatura.termosVersao ?? null,
    backoffice: assinatura.backoffice
      ? {
          nome: assinatura.backoffice.nome,
          razaoSocial: assinatura.backoffice.razaoSocial ?? null,
          cpf: assinatura.backoffice.cpf,
          cnpj: assinatura.backoffice.cnpj ?? null,
          telefone: assinatura.backoffice.telefone ?? null,
          email: assinatura.backoffice.usuario?.email ?? null,
        }
      : null,
    faturas,
  });
}
