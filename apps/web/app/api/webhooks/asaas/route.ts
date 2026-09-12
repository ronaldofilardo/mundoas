import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { criarAuditLog } from "@/lib/audit";

// Webhook do Asaas — recebe eventos de Assinatura (SUBSCRIPTION_*) e de
// Cobrança (PAYMENT_*). Configurar em: painel Asaas > Integrações > Webhooks.
//
// IMPORTANTE: os eventos de PAGAMENTO (PAYMENT_CONFIRMED, PAYMENT_RECEIVED,
// PAYMENT_OVERDUE, PAYMENT_CREATED) precisam estar habilitados no painel —
// são eles que efetivamente movem o status da assinatura para ATIVA/
// INADIMPLENTE. Os eventos de Assinatura sozinhos (SUBSCRIPTION_CREATED/
// UPDATED/DELETED) não avisam quando uma cobrança específica é paga.
//
// Autenticação: o Asaas envia o token configurado no cabeçalho
// "asaas-access-token". Configurar ASAAS_WEBHOOK_TOKEN no .env com o mesmo
// valor definido no painel do Asaas ao criar o webhook.

type AsaasWebhookBody = {
  id?: string;
  event: string;
  payment?: {
    id: string;
    subscription?: string;
    status: string;
    value: number;
    dueDate: string;
    billingType?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
  };
  subscription?: {
    id: string;
    status: string;
  };
};

const STATUS_PAGAMENTO_ASAAS: Record<string, "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "DELETED"> = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  CONFIRMED: "CONFIRMED",
  OVERDUE: "OVERDUE",
  REFUNDED: "REFUNDED",
  DELETED: "DELETED",
};

export async function POST(req: NextRequest) {
  const tokenEsperado = process.env.ASAAS_WEBHOOK_TOKEN;
  const tokenRecebido = req.headers.get("asaas-access-token");

  // Segurança crítica: rejeitar se token não estiver configurado no servidor ou se diferir do recebido
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return NextResponse.json({ error: "Token de webhook inválido ou não configurado." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as AsaasWebhookBody | null;
  if (!body?.event) {
    return NextResponse.json({ ok: true }); // corpo inesperado — não falha, apenas ignora
  }

  // Idempotência: chave única por evento
  const asaasEventId =
    body.id ||
    (body.payment?.id
      ? `${body.event}:${body.payment.id}:${body.payment.status}`
      : body.subscription?.id
        ? `${body.event}:${body.subscription.id}:${body.subscription.status}`
        : undefined);

  if (asaasEventId && prisma.asaasWebhookEvent?.findUnique) {
    const jaProcessado = await prisma.asaasWebhookEvent
      .findUnique({ where: { asaasEventId } })
      .catch(() => null);
    if (jaProcessado) {
      return NextResponse.json({ ok: true, idempotente: true });
    }
  }

  try {
    switch (body.event) {
      // ---- Cobranças: o que de fato ativa/suspende a unidade -------------
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        if (!body.payment?.subscription) break;
        const assinatura = await prisma.assinatura.findFirst({
          where: { asaasSubscriptionId: body.payment.subscription },
        });
        if (!assinatura) break;

        await prisma.faturaAsaas.upsert({
          where: { asaasPaymentId: body.payment.id },
          create: {
            assinaturaId: assinatura.id,
            asaasPaymentId: body.payment.id,
            valor: body.payment.value,
            vencimento: new Date(body.payment.dueDate),
            statusPagamento: STATUS_PAGAMENTO_ASAAS[body.payment.status] ?? "CONFIRMED",
            linkFatura: body.payment.invoiceUrl,
            linkBoleto: body.payment.bankSlipUrl,
            pagoEm: new Date(),
          },
          update: {
            statusPagamento: STATUS_PAGAMENTO_ASAAS[body.payment.status] ?? "CONFIRMED",
            pagoEm: new Date(),
          },
        });

        // Primeira confirmação de pagamento: sai de PENDENTE_PAGAMENTO (ou
        // de INADIMPLENTE, se estava suspensa) e libera o acesso.
        if (["PENDENTE_PAGAMENTO", "INADIMPLENTE"].includes(assinatura.statusAssinatura)) {
          await prisma.assinatura.update({
            where: { id: assinatura.id },
            data: { statusAssinatura: "ATIVA" },
          });
        }
        break;
      }

      case "PAYMENT_OVERDUE": {
        if (!body.payment?.subscription) break;
        const assinatura = await prisma.assinatura.findFirst({
          where: { asaasSubscriptionId: body.payment.subscription },
        });
        if (!assinatura) break;

        await prisma.faturaAsaas.updateMany({
          where: { asaasPaymentId: body.payment.id },
          data: { statusPagamento: "OVERDUE" },
        });

        // Só suspende quem já estava ATIVA (unidade em uso normal que
        // deixou de pagar). Não mexe em quem ainda está no meio do
        // onboarding (PENDENTE_PAGAMENTO) — lá o próprio middleware já
        // mantém o acesso bloqueado até o primeiro pagamento confirmar.
        if (assinatura.statusAssinatura === "ATIVA") {
          await prisma.assinatura.update({
            where: { id: assinatura.id },
            data: { statusAssinatura: "INADIMPLENTE" },
          });
        }
        break;
      }

      case "PAYMENT_CREATED":
      case "PAYMENT_UPDATED": {
        if (!body.payment?.subscription) break;
        const assinatura = await prisma.assinatura.findFirst({
          where: { asaasSubscriptionId: body.payment.subscription },
        });
        if (!assinatura) break;

        await prisma.faturaAsaas.upsert({
          where: { asaasPaymentId: body.payment.id },
          create: {
            assinaturaId: assinatura.id,
            asaasPaymentId: body.payment.id,
            valor: body.payment.value,
            vencimento: new Date(body.payment.dueDate),
            statusPagamento: STATUS_PAGAMENTO_ASAAS[body.payment.status] ?? "PENDING",
            linkFatura: body.payment.invoiceUrl,
            linkBoleto: body.payment.bankSlipUrl,
          },
          update: {
            statusPagamento: STATUS_PAGAMENTO_ASAAS[body.payment.status] ?? "PENDING",
            linkFatura: body.payment.invoiceUrl,
            linkBoleto: body.payment.bankSlipUrl,
          },
        });
        break;
      }

      // ---- Assinatura: fim de ciclo / cancelamento -------------------------
      case "SUBSCRIPTION_DELETED":
      case "SUBSCRIPTION_INACTIVATED": {
        if (!body.subscription?.id) break;
        const assinatura = await prisma.assinatura.findFirst({
          where: { asaasSubscriptionId: body.subscription.id },
        });
        if (!assinatura) break;
        if (["ATIVA", "INADIMPLENTE"].includes(assinatura.statusAssinatura)) {
          await prisma.assinatura.update({
            where: { id: assinatura.id },
            data: { statusAssinatura: "CANCELADA" },
          });
        }
        break;
      }

      // Demais eventos de assinatura (CREATED/UPDATED/SPLIT_*) — apenas
      // registrados em log por ora, sem ação automática.
      default:
        break;
    }

    await criarAuditLog({
      acao: `ASAAS_WEBHOOK_${body.event}`,
      entidade: "assinatura",
      entidadeId: body.payment?.subscription || body.subscription?.id,
      detalhes: { event: body.event },
    });

    if (asaasEventId && prisma.asaasWebhookEvent?.create) {
      await prisma.asaasWebhookEvent
        .create({
          data: {
            asaasEventId,
            tipoEvento: body.event,
            payloadJson: body as any,
            processadoEm: new Date(),
          },
        })
        .catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[webhooks/asaas] Erro ao processar evento:", body.event, err);
    if (asaasEventId && prisma.asaasWebhookEvent?.create) {
      await prisma.asaasWebhookEvent
        .create({
          data: {
            asaasEventId,
            tipoEvento: body.event,
            payloadJson: body as any,
            erro: err instanceof Error ? err.message : String(err),
          },
        })
        .catch(() => null);
    }
    // Sempre 200 para o Asaas não ficar retentando indefinidamente por um
    // erro nosso; o log acima é o que fica para investigação.
    return NextResponse.json({ ok: true, aviso: "Erro interno ao processar, verificar logs." });
  }
}
