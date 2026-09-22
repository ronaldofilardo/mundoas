import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { criarAuditLog } from "@/lib/audit";
import {
  isFaturaBloqueavel,
  desbloquearUnidadeSeRegularizada,
  calcularDiasAtraso,
  extrairDataBrasilia,
} from "@/lib/billing/inadimplencia";

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
    externalReference?: string;
  };
  subscription?: {
    id: string;
    status: string;
  };
};

type StatusPagamento = "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "DELETED";

const STATUS_PAGAMENTO_ASAAS: Record<string, StatusPagamento> = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  CONFIRMED: "CONFIRMED",
  OVERDUE: "OVERDUE",
  REFUNDED: "REFUNDED",
  DELETED: "DELETED",
};

function isStatusPago(status: StatusPagamento): boolean {
  return status === "RECEIVED" || status === "CONFIRMED";
}

/**
 * Localiza a fatura avulsa de um pagamento sem subscription.
 * 1) Tenta pelo asaasPaymentId gravado na criação da fatura.
 * 2) Fallback: externalReference (= backofficeId) → assinatura → fatura
 *    pendente sem paymentId vinculado (ou com o mesmo paymentId), casando
 *    por valor/vencimento quando houver mais de uma candidata.
 */
async function localizarFaturaAvulsa(payment: NonNullable<AsaasWebhookBody["payment"]>) {
  const porPaymentId = await prisma.faturaAsaas.findUnique({
    where: { asaasPaymentId: payment.id },
  });
  if (porPaymentId) return porPaymentId;

  if (!payment.externalReference) return null;

  const assinatura = await prisma.assinatura.findFirst({
    where: { backofficeId: payment.externalReference },
  });
  if (!assinatura) return null;

  const candidatas = await prisma.faturaAsaas.findMany({
    where: {
      assinaturaId: assinatura.id,
      pagoManualmente: false,
      statusPagamento: { notIn: ["CONFIRMED", "RECEIVED"] },
      OR: [{ asaasPaymentId: null }, { asaasPaymentId: payment.id }],
    },
    orderBy: { vencimento: "asc" },
  });
  if (candidatas.length === 0) return null;

  const vencimentoAlvo = payment.dueDate?.slice(0, 10);
  const casamentoExato = candidatas.find((f) => {
    if (f.asaasPaymentId === payment.id) return true;
    if (Math.abs(Number(f.valor) - payment.value) >= 0.005) return false;
    if (!vencimentoAlvo) return true;
    return (
      f.vencimento.toISOString().slice(0, 10) === vencimentoAlvo ||
      extrairDataBrasilia(f.vencimento) === vencimentoAlvo
    );
  });

  return casamentoExato ?? candidatas[0];
}

async function baixarFaturaAvulsa(
  payment: NonNullable<AsaasWebhookBody["payment"]>,
  status: StatusPagamento,
) {
  const fatura = await localizarFaturaAvulsa(payment);
  if (!fatura) return false;

  const jaPaga =
    isStatusPago((fatura.statusPagamento as StatusPagamento) ?? "PENDING") ||
    fatura.pagoManualmente;

  // Nunca regride de paga → pendente (ex.: PAYMENT_CREATED reentregue após
  // o RECEIVED). Nesse caso só propaga links, se vierem.
  if (jaPaga && !isStatusPago(status)) {
    if (payment.invoiceUrl || payment.bankSlipUrl) {
      await prisma.faturaAsaas.update({
        where: { id: fatura.id },
        data: {
          linkFatura: payment.invoiceUrl ?? undefined,
          linkBoleto: payment.bankSlipUrl ?? undefined,
        },
      });
    }
    return true;
  }

  await prisma.faturaAsaas.update({
    where: { id: fatura.id },
    data: {
      statusPagamento: status,
      asaasPaymentId: fatura.asaasPaymentId ?? payment.id,
      linkFatura: payment.invoiceUrl ?? undefined,
      linkBoleto: payment.bankSlipUrl ?? undefined,
      ...(isStatusPago(status) ? { pagoEm: new Date() } : {}),
    },
  });
  return true;
}

export async function POST(req: NextRequest) {
  const tokenEsperado = (process.env.ASAAS_WEBHOOK_TOKEN ?? "").trim();
  const tokenRecebido = (req.headers.get("asaas-access-token") ?? "").trim();

  // Segurança crítica: rejeitar se token não estiver configurado no servidor ou se diferir do recebido
  if (!tokenEsperado || !tokenRecebido || tokenRecebido !== tokenEsperado) {
    // Diagnóstico seguro (sem expor o token completo) — visível na resposta do Asaas e nos logs
    const debug = {
      serverConfigured: Boolean(tokenEsperado),
      headerPresent: Boolean(tokenRecebido),
      serverLen: tokenEsperado.length,
      headerLen: tokenRecebido.length,
      serverPrefix: tokenEsperado.slice(0, 12),
      headerPrefix: tokenRecebido.slice(0, 12),
      match: Boolean(tokenEsperado) && Boolean(tokenRecebido) && tokenRecebido === tokenEsperado,
    };
    console.error("[webhooks/asaas] 401 auth:", JSON.stringify(debug));
    return NextResponse.json(
      { error: "Token de webhook inválido ou não configurado.", debug },
      { status: 401 },
    );
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
        if (body.payment?.subscription) {
          // ── Cobrança de mensalidade (vinculada a uma subscription) ──────
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

          // Confirmação de pagamento: sai de PENDENTE_PAGAMENTO (ou
          // de INADIMPLENTE, se estava suspensa) e libera o acesso se regularizada.
          if (assinatura.statusAssinatura === "PENDENTE_PAGAMENTO") {
            await prisma.assinatura.update({
              where: { id: assinatura.id },
              data: { statusAssinatura: "ATIVA", bloqueadoEm: null, motivoBloqueio: null },
            });
          } else if (assinatura.statusAssinatura === "INADIMPLENTE") {
            await desbloquearUnidadeSeRegularizada(assinatura.id);
          }
        } else {
          // ── Cobrança avulsa (sem subscription) ─────────────────────────
          // Tenta pelo asaasPaymentId; se não achar, faz fallback pelo
          // externalReference (backofficeId) para achar a fatura pendente.
          const status =
            STATUS_PAGAMENTO_ASAAS[body.payment!.status] ?? "CONFIRMED";
          await baixarFaturaAvulsa(body.payment!, status);
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

        // Só suspende quem já estava ATIVA e se o atraso já ultrapassou os
        // 15 dias de tolerância (ou seja, a partir do dia 31 / dia 1º).
        // Não bloqueia imediatamente no primeiro dia de vencimento.
        const faturaBloqueavel = isFaturaBloqueavel({
          vencimento: body.payment.dueDate,
        });

        if (assinatura.statusAssinatura === "ATIVA" && faturaBloqueavel) {
          const diasAtraso = calcularDiasAtraso(body.payment.dueDate);
          await prisma.assinatura.update({
            where: { id: assinatura.id },
            data: {
              statusAssinatura: "INADIMPLENTE",
              bloqueadoEm: new Date(),
              motivoBloqueio: `Inadimplência: mensalidade vencida há ${diasAtraso} dias`,
            },
          });
        }
        break;
      }

      case "PAYMENT_CREATED":
      case "PAYMENT_UPDATED": {
        if (!body.payment) break;

        if (body.payment.subscription) {
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

        // ── Cobrança avulsa: PAYMENT_UPDATED pode trazer a baixa do PIX
        // quando o evento RECEIVED/CONFIRMED não chegou. Só baixa se o
        // status mapeado for pago (ou se for só atualização de link).
        const statusAvulsa = STATUS_PAGAMENTO_ASAAS[body.payment.status];
        if (!statusAvulsa) break;
        if (
          body.event === "PAYMENT_UPDATED" ||
          isStatusPago(statusAvulsa) ||
          body.payment.invoiceUrl ||
          body.payment.bankSlipUrl
        ) {
          await baixarFaturaAvulsa(body.payment, statusAvulsa);
        }
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
