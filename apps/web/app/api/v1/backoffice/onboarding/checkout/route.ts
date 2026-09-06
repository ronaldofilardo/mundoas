import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireBackofficeWithScope, badRequest, notFound, ok } from "@/lib/api-helpers";
import { PLANOS, DIA_VENCIMENTO } from "@/lib/legal/mundoas-termos";
import {
  buscarOuCriarCustomer,
  criarSubscription,
  buscarPrimeiraFatura,
  buscarQrCodePix,
  type BillingType,
} from "@/lib/asaas/client";

function proximoVencimento(dia: number): string {
  const hoje = new Date();
  let alvo = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
  if (alvo <= hoje) {
    alvo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
  }
  return alvo.toISOString().slice(0, 10);
}

// POST: Etapa 4 do Plano de Implementação — cria o Customer e a Subscription
// no Asaas para a unidade, salva os IDs na Assinatura e devolve os dados de
// pagamento (link do boleto/invoice, ou PIX copia-e-cola) para o checkout.
export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { metodoPagamento } = body as { metodoPagamento?: "CARTAO" | "PIX" | "BOLETO" };

  if (!metodoPagamento || !["CARTAO", "PIX", "BOLETO"].includes(metodoPagamento)) {
    return badRequest("Selecione um método de pagamento válido.");
  }

  const backoffice = await prisma.backoffice.findUnique({
    where: { id: backofficeId! },
    select: {
      nome: true,
      razaoSocial: true,
      cpf: true,
      cnpj: true,
      telefone: true,
      usuario: { select: { email: true } },
      assinatura: { select: { id: true, statusAssinatura: true, planoAssinatura: true, asaasCustomerId: true } },
    },
  });

  if (!backoffice) return notFound("Unidade não encontrada.");
  if (!backoffice.assinatura) return notFound("Assinatura não encontrada para esta unidade.");
  if (!backoffice.assinatura.planoAssinatura) {
    return badRequest("Selecione um plano antes de prosseguir para o pagamento.");
  }
  if (backoffice.assinatura.statusAssinatura === "PENDENTE_TERMOS") {
    return badRequest("É necessário aceitar os termos antes do pagamento.");
  }

  const plano = PLANOS[backoffice.assinatura.planoAssinatura];
  const billingType: BillingType =
    metodoPagamento === "CARTAO" ? "CREDIT_CARD" : metodoPagamento === "PIX" ? "PIX" : "BOLETO";

  try {
    const customer = await buscarOuCriarCustomer({
      name: backoffice.razaoSocial || backoffice.nome,
      cpfCnpj: backoffice.cnpj || backoffice.cpf,
      email: backoffice.usuario.email,
      phone: backoffice.telefone,
      externalReference: backofficeId!,
    });

    const subscription = await criarSubscription({
      customerId: customer.id,
      billingType,
      value: plano.valor,
      cycle: backoffice.assinatura.planoAssinatura === "MENSAL" ? "MONTHLY" : "YEARLY",
      nextDueDate: proximoVencimento(DIA_VENCIMENTO),
      description: `Licença de uso da plataforma mundoAS — plano ${plano.label}`,
      externalReference: backofficeId!,
    });

    await prisma.assinatura.update({
      where: { id: backoffice.assinatura.id },
      data: {
        asaasCustomerId: customer.id,
        asaasSubscriptionId: subscription.id,
        // O status só vira ATIVA de fato quando o webhook confirmar o
        // primeiro pagamento (PAYMENT_CONFIRMED/PAYMENT_RECEIVED). Até lá,
        // permanece PENDENTE_PAGAMENTO — mesmo já com assinatura criada no
        // Asaas, para não liberar acesso antes da confirmação real.
      },
    });

    const primeiraFatura = await buscarPrimeiraFatura(subscription.id);

    // Salva a fatura já no ato do checkout (não espera o webhook do Asaas),
    // pra ela aparecer imediatamente na lista de Faturas do admin. O webhook
    // continua sendo a fonte de verdade pra confirmação de pagamento —
    // aqui só garantimos que a cobrança em aberto já fica visível.
    if (primeiraFatura) {
      await prisma.faturaAsaas.upsert({
        where: { asaasPaymentId: primeiraFatura.id },
        create: {
          assinaturaId: backoffice.assinatura.id,
          asaasPaymentId: primeiraFatura.id,
          valor: primeiraFatura.value,
          vencimento: new Date(primeiraFatura.dueDate),
          statusPagamento: "PENDING",
          formaPagamento: billingType === "PIX" ? "PIX" : billingType === "BOLETO" ? "BOLETO" : undefined,
          linkFatura: primeiraFatura.invoiceUrl,
          linkBoleto: primeiraFatura.bankSlipUrl,
        },
        update: {
          linkFatura: primeiraFatura.invoiceUrl,
          linkBoleto: primeiraFatura.bankSlipUrl,
        },
      });
    }

    let pix: { encodedImage: string; payload: string } | null = null;
    if (billingType === "PIX" && primeiraFatura) {
      pix = await buscarQrCodePix(primeiraFatura.id);
    }

    return ok({
      subscriptionId: subscription.id,
      metodoPagamento,
      fatura: primeiraFatura
        ? {
            id: primeiraFatura.id,
            valor: primeiraFatura.value,
            vencimento: primeiraFatura.dueDate,
            linkFatura: primeiraFatura.invoiceUrl,
            linkBoleto: primeiraFatura.bankSlipUrl,
          }
        : null,
      pix,
    });
  } catch (err: unknown) {
    console.error("[onboarding/checkout] Erro ao criar assinatura no Asaas:", err);
    return badRequest(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento. Tente novamente.");
  }
}
