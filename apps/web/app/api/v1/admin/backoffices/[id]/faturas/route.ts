import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireAdmin, badRequest, notFound, created, ok } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { valor, vencimento, pago, formaPagamento } = body as {
      valor?: number;
      vencimento?: string;
      pago?: boolean;
      formaPagamento?: "BOLETO" | "PIX";
    };

    if (!valor || valor <= 0) {
      return badRequest("Informe um valor válido.");
    }
    if (!vencimento) {
      return badRequest("Informe a data de vencimento.");
    }
    if (formaPagamento && !["BOLETO", "PIX"].includes(formaPagamento)) {
      return badRequest("Forma de pagamento inválida.");
    }

    let assinatura = await prisma.assinatura.findUnique({
      where: { backofficeId: params.id },
    });

    if (!assinatura) {
      assinatura = await prisma.assinatura.create({
        data: {
          backofficeId: params.id,
          statusAssinatura: "CORTESIA",
          cortesiaDesde: new Date(),
          cortesiaPorUsuarioId: session!.user.id,
          motivoCortesia: "Assinatura criada automaticamente — unidade sem assinatura",
        },
      });
    }

    // Registrar como já paga (pagamento recebido fora do Asaas — dinheiro,
    // transferência, PIX manual, etc.) exige que a unidade já tenha
    // aceitado os termos jurídicos do onboarding. O pagamento não substitui
    // esse aceite.
    if (pago && assinatura.statusAssinatura === "PENDENTE_TERMOS") {
      return badRequest(
        "Esta unidade ainda não aceitou os termos de uso. Não é possível dar baixa em pagamento antes disso.",
      );
    }

    const fatura = await prisma.$transaction(async (tx) => {
      const novaFatura = await tx.faturaAsaas.create({
        data: {
          assinaturaId: assinatura!.id,
          valor,
          vencimento: new Date(vencimento),
          statusPagamento: pago ? "CONFIRMED" : "PENDING",
          formaPagamento: formaPagamento ?? undefined,
          pagoManualmente: !!pago,
          pagoEm: pago ? new Date() : null,
          marcadoPagoPorUsuarioId: pago ? session!.user.id : null,
          marcadoPagoEm: pago ? new Date() : null,
        },
      });

      // Baixa manual dá acesso à unidade tanto na ativação inicial
      // (PENDENTE_PAGAMENTO — onboarding sem passar pelo Asaas) quanto na
      // regularização de uma unidade já ativa que ficou inadimplente.
      if (pago && ["PENDENTE_PAGAMENTO", "INADIMPLENTE"].includes(assinatura!.statusAssinatura)) {
        await tx.assinatura.update({
          where: { id: assinatura!.id },
          data: { statusAssinatura: "ATIVA" },
        });
      }

      return novaFatura;
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: pago ? "FATURA_CRIAR_MANUAL_PAGA" : "FATURA_CRIAR_MANUAL",
      entidade: "fatura_asaas",
      entidadeId: fatura.id,
      detalhes: { backofficeId: params.id, valor, vencimento, pago: !!pago, formaPagamento },
    });

    return created(fatura);
  } catch (err: unknown) {
    console.error("[admin/backoffices/[id]/faturas] Erro ao criar fatura:", err);
    return badRequest((err instanceof Error ? err.message : "Erro interno ao criar fatura."));
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId: params.id },
  });

  if (!assinatura) {
    assinatura = await prisma.assinatura.create({
      data: {
        backofficeId: params.id,
        statusAssinatura: "CORTESIA",
        cortesiaDesde: new Date(),
        cortesiaPorUsuarioId: session!.user.id,
        motivoCortesia: "Assinatura criada automaticamente — unidade sem assinatura",
      },
    });
  }

  const faturas = await prisma.faturaAsaas.findMany({
    where: { assinaturaId: assinatura.id },
    orderBy: { vencimento: "desc" },
  });

  return ok(faturas);
}
