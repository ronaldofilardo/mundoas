import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/asaas/route";
import { prisma } from "@/lib/db";
import { criarAuditLog } from "@/lib/audit";

vi.mock("@/lib/db", () => {
  const mPrisma = {
    assinatura: { findFirst: vi.fn(), update: vi.fn() },
    faturaAsaas: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    asaasWebhookEvent: { findUnique: vi.fn(), create: vi.fn() },
  };
  return { prisma: mPrisma };
});

vi.mock("@asa/database", () => {
  const mPrisma = {
    assinatura: { findFirst: vi.fn(), update: vi.fn() },
    faturaAsaas: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    asaasWebhookEvent: { findUnique: vi.fn(), create: vi.fn() },
  };
  return { prisma: mPrisma };
});

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const prismaMock = vi.mocked(prisma);
const auditMock = vi.mocked(criarAuditLog);

function buildRequest(body: unknown, token?: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/asaas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "asaas-access-token": token } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("API webhooks/asaas — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASAAS_WEBHOOK_TOKEN = "whsec_test";
    prismaMock.asaasWebhookEvent.findUnique.mockResolvedValue(null as never);
    prismaMock.asaasWebhookEvent.create.mockResolvedValue({} as never);
  });

  it("rejeita token inválido", async () => {
    const response = await POST(buildRequest({ event: "PAYMENT_CONFIRMED" }, "token-errado"));

    expect(response.status).toBe(401);
    expect(prismaMock.assinatura.findFirst).not.toHaveBeenCalled();
  });

  it("rejeita requisição quando ASAAS_WEBHOOK_TOKEN não configurado", async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = "";
    const response = await POST(buildRequest({ event: "PAYMENT_CONFIRMED" }));

    expect(response.status).toBe(401);
    expect(prismaMock.assinatura.findFirst).not.toHaveBeenCalled();
  });

  it("retorna ok idempotente para evento repetido", async () => {
    prismaMock.asaasWebhookEvent.findUnique.mockResolvedValue({ id: "evt-ja-existente" } as never);
    const response = await POST(
      buildRequest(
        {
          id: "evt-123",
          event: "PAYMENT_CONFIRMED",
          payment: { id: "payment-1", subscription: "subscription-1", status: "CONFIRMED", value: 350, dueDate: "2026-10-15" },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.idempotente).toBe(true);
    expect(prismaMock.assinatura.findFirst).not.toHaveBeenCalled();
  });

  it("ignora corpo sem event", async () => {
    const response = await POST(buildRequest(null, "whsec_test"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(prismaMock.assinatura.findFirst).not.toHaveBeenCalled();
  });

  it("PAYMENT_CONFIRMED com subscription ativa PENDENTE_PAGAMENTO -> ATIVA", async () => {
    prismaMock.assinatura.findFirst.mockResolvedValue({
      id: "assinatura-1",
      statusAssinatura: "PENDENTE_PAGAMENTO",
    } as never);
    prismaMock.faturaAsaas.upsert.mockResolvedValue({} as never);

    const response = await POST(
      buildRequest(
        {
          event: "PAYMENT_CONFIRMED",
          payment: { id: "payment-1", subscription: "subscription-1", status: "CONFIRMED", value: 350, dueDate: "2026-10-15" },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.faturaAsaas.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { asaasPaymentId: "payment-1" },
        create: expect.objectContaining({
          assinaturaId: "assinatura-1",
          statusPagamento: "CONFIRMED",
          pagoEm: expect.any(Date),
        }),
        update: expect.objectContaining({
          statusPagamento: "CONFIRMED",
          pagoEm: expect.any(Date),
        }),
      }),
    );
    expect(prismaMock.assinatura.update).toHaveBeenCalledWith({
      where: { id: "assinatura-1" },
      data: { statusAssinatura: "ATIVA", bloqueadoEm: null, motivoBloqueio: null },
    });
  });

  it("PAYMENT_CONFIRMED não mexe em assinatura CORTESIA", async () => {
    prismaMock.assinatura.findFirst.mockResolvedValue({
      id: "assinatura-1",
      statusAssinatura: "CORTESIA",
    } as never);

    const response = await POST(
      buildRequest(
        {
          event: "PAYMENT_CONFIRMED",
          payment: { id: "payment-1", subscription: "subscription-1", status: "CONFIRMED", value: 350, dueDate: "2026-10-15" },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.assinatura.update).not.toHaveBeenCalled();
  });

  it("PAYMENT_OVERDUE suspende unidade ATIVA", async () => {
    prismaMock.assinatura.findFirst.mockResolvedValue({
      id: "assinatura-1",
      statusAssinatura: "ATIVA",
    } as never);

    const response = await POST(
      buildRequest(
        {
          event: "PAYMENT_OVERDUE",
          payment: { id: "payment-1", subscription: "subscription-1", status: "OVERDUE", dueDate: "2026-01-01", value: 350 },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.faturaAsaas.updateMany).toHaveBeenCalledWith({
      where: { asaasPaymentId: "payment-1" },
      data: { statusPagamento: "OVERDUE" },
    });
    expect(prismaMock.assinatura.update).toHaveBeenCalledWith({
      where: { id: "assinatura-1" },
      data: expect.objectContaining({ statusAssinatura: "INADIMPLENTE" }),
    });
  });

  it("SUBSCRIPTION_DELETED marca assinatura como CANCELADA", async () => {
    prismaMock.assinatura.findFirst.mockResolvedValue({
      id: "assinatura-1",
      statusAssinatura: "ATIVA",
    } as never);

    const response = await POST(
      buildRequest(
        { event: "SUBSCRIPTION_DELETED", subscription: { id: "subscription-1" } },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.assinatura.update).toHaveBeenCalledWith({
      where: { id: "assinatura-1" },
      data: { statusAssinatura: "CANCELADA" },
    });
  });

  it("eventos desconhecidos retornam 200 sem alterar banco", async () => {
    const response = await POST(buildRequest({ event: "UNKNOWN_EVENT" }, "whsec_test"));

    expect(response.status).toBe(200);
    expect(prismaMock.assinatura.findFirst).not.toHaveBeenCalled();
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ acao: "ASAAS_WEBHOOK_UNKNOWN_EVENT" }),
    );
  });

  it("PAYMENT_RECEIVED avulsa atualiza fatura pelo asaasPaymentId", async () => {
    prismaMock.faturaAsaas.findUnique.mockResolvedValue({
      id: "fatura-1",
      asaasPaymentId: "payment-avulsa",
      statusPagamento: "PENDING",
      pagoManualmente: false,
      vencimento: new Date("2026-10-15"),
      valor: 100,
    } as never);

    const response = await POST(
      buildRequest(
        {
          event: "PAYMENT_RECEIVED",
          payment: {
            id: "payment-avulsa",
            status: "RECEIVED",
            value: 100,
            dueDate: "2026-10-15",
            externalReference: "backoffice-1",
          },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.faturaAsaas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "fatura-1" },
        data: expect.objectContaining({
          statusPagamento: "RECEIVED",
          asaasPaymentId: "payment-avulsa",
          pagoEm: expect.any(Date),
        }),
      }),
    );
  });

  it("PAYMENT_RECEIVED avulsa faz fallback por externalReference quando findUnique falha", async () => {
    prismaMock.faturaAsaas.findUnique.mockResolvedValue(null as never);
    prismaMock.assinatura.findFirst.mockResolvedValue({ id: "assinatura-1" } as never);
    prismaMock.faturaAsaas.findMany.mockResolvedValue([
      {
        id: "fatura-orfa",
        asaasPaymentId: null,
        statusPagamento: "PENDING",
        pagoManualmente: false,
        valor: 100,
        vencimento: new Date("2026-10-15"),
      },
    ] as never);

    const response = await POST(
      buildRequest(
        {
          event: "PAYMENT_RECEIVED",
          payment: {
            id: "payment-avulsa",
            status: "RECEIVED",
            value: 100,
            dueDate: "2026-10-15",
            externalReference: "backoffice-1",
          },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.assinatura.findFirst).toHaveBeenCalledWith({
      where: { backofficeId: "backoffice-1" },
    });
    expect(prismaMock.faturaAsaas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "fatura-orfa" },
        data: expect.objectContaining({
          statusPagamento: "RECEIVED",
          asaasPaymentId: "payment-avulsa",
        }),
      }),
    );
  });

  it("PAYMENT_UPDATED avulsa com status RECEIVED baixa a fatura", async () => {
    prismaMock.faturaAsaas.findUnique.mockResolvedValue({
      id: "fatura-1",
      asaasPaymentId: "payment-avulsa",
      statusPagamento: "PENDING",
      pagoManualmente: false,
      vencimento: new Date("2026-10-15"),
      valor: 100,
    } as never);

    const response = await POST(
      buildRequest(
        {
          event: "PAYMENT_UPDATED",
          payment: {
            id: "payment-avulsa",
            status: "RECEIVED",
            value: 100,
            dueDate: "2026-10-15",
            externalReference: "backoffice-1",
          },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.faturaAsaas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          statusPagamento: "RECEIVED",
          pagoEm: expect.any(Date),
        }),
      }),
    );
  });

  it("não regride fatura já paga para PENDING em PAYMENT_CREATED avulsa", async () => {
    prismaMock.faturaAsaas.findUnique.mockResolvedValue({
      id: "fatura-1",
      asaasPaymentId: "payment-avulsa",
      statusPagamento: "RECEIVED",
      pagoManualmente: false,
      vencimento: new Date("2026-10-15"),
      valor: 100,
    } as never);

    const response = await POST(
      buildRequest(
        {
          event: "PAYMENT_CREATED",
          payment: {
            id: "payment-avulsa",
            status: "PENDING",
            value: 100,
            dueDate: "2026-10-15",
            externalReference: "backoffice-1",
            invoiceUrl: "https://go.asaas.com/x",
          },
        },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    const updateCall = prismaMock.faturaAsaas.update.mock.calls[0]?.[0];
    expect(updateCall?.data?.statusPagamento).toBeUndefined();
    expect(updateCall?.data?.linkFatura).toBe("https://go.asaas.com/x");
    expect(updateCall?.data?.pagoEm).toBeUndefined();
  });

  it("retorna 200 mesmo quando ocorre erro interno", async () => {
    prismaMock.assinatura.findFirst.mockRejectedValue(new Error("db down"));
    process.env.ASAAS_WEBHOOK_TOKEN = "whsec_test";

    const response = await POST(
      buildRequest(
        { event: "PAYMENT_CONFIRMED", payment: { id: "p1", subscription: "s1", status: "CONFIRMED" } },
        "whsec_test",
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.aviso).toBe("Erro interno ao processar, verificar logs.");
  });
});
