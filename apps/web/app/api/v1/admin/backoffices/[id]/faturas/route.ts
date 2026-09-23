import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireAdmin, badRequest, notFound, created, ok } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { buscarOuCriarCustomer, criarCobrancaAvulsa, type BillingType } from "@/lib/asaas/client";
import { sincronizarStatusComAsaas } from "@/lib/asaas/sync-pull";

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
        "Esta unidade ainda não aceitado os termos de uso. Não é possível dar baixa em pagamento antes disso.",
      );
    }

    let asaasPaymentId: string | null = null;
    let linkFatura: string | null = null;
    let linkBoleto: string | null = null;

    // Se não for pagamento já recebido (offline), gera a cobrança no gateway Asaas
    // para viabilizar o link de pagamento para a unidade.
    if (!pago && process.env.ASAAS_API_KEY && prisma.backoffice?.findUnique) {
      try {
        const backoffice = await prisma.backoffice.findUnique({
          where: { id: params.id },
          select: {
            nome: true,
            razaoSocial: true,
            cpf: true,
            cnpj: true,
            telefone: true,
            emailCobranca: true,
            usuario: { select: { email: true } },
          },
        });

        if (backoffice) {
          const customer = await buscarOuCriarCustomer({
            name: backoffice.razaoSocial || backoffice.nome,
            cpfCnpj: backoffice.cnpj || backoffice.cpf,
            email: backoffice.emailCobranca || backoffice.usuario.email,
            phone: backoffice.telefone,
            externalReference: params.id,
          });

          if (!assinatura.asaasCustomerId) {
            await prisma.assinatura.update({
              where: { id: assinatura.id },
              data: { asaasCustomerId: customer.id },
            });
          }

          const billingType: BillingType =
            formaPagamento === "PIX" ? "PIX" : formaPagamento === "BOLETO" ? "BOLETO" : "UNDEFINED";

          const cobranca = await criarCobrancaAvulsa({
            customerId: customer.id,
            value: valor,
            dueDate: vencimento.slice(0, 10),
            billingType,
            description: `Fatura avulsa — Unidade ${backoffice.nome}`,
            externalReference: params.id,
          });

          asaasPaymentId = cobranca.id;
          linkFatura = cobranca.invoiceUrl ?? null;
          linkBoleto = cobranca.bankSlipUrl ?? null;
        }
      } catch (errAsaas) {
        console.error("[faturas/route] Erro ao gerar cobrança avulsa no Asaas:", errAsaas);
      }
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
          asaasPaymentId,
          linkFatura,
          linkBoleto,
        },
      });

      // Baixa manual dá acesso à unidade tanto na ativação inicial
      // (PENDENTE_PAGAMENTO — onboarding sem passar pelo Asaas) quanto na
      // regularização de uma unidade já ativa que ficou inadimplente.
      if (pago && ["PENDENTE_PAGAMENTO", "INADIMPLENTE"].includes(assinatura!.statusAssinatura)) {
        await tx.assinatura.update({
          where: { id: assinatura!.id },
          data: { statusAssinatura: "ATIVA", bloqueadoEm: null, motivoBloqueio: null },
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

  // Fallback do webhook: baixa pendências já pagas no Asaas antes de listar
  const faturasSincronizadas = await sincronizarStatusComAsaas(faturas);

  return ok(faturasSincronizadas);
}
