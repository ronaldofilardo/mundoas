import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/asaas/route";
import { prisma } from "@asa/database";
import { criarAuditLog } from "@/lib/audit";

vi.mock("@asa/database", () => ({
  prisma: {
    assinatura: { findFirst: vi.fn(), update: vi.fn() },
    faturaAsaas: { upsert: vi.fn(), updateMany: vi.fn() },
  },
}));

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
  });

  it("rejeita token inválido", async () => {
    const response = await POST(buildRequest({ event: "PAYMENT_CONFIRMED" }, "token-errado"));

    expect(response.status).toBe(401);
    expect(prismaMock.assinatura.findFirst).not.toHaveBeenCalled();
  });

  it("aceita requisição sem token quando ASAAS_WEBHOOK_TOKEN não configurado", async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = "";
    const response = await POST(buildRequest({ event: "PAYMENT_CONFIRMED" }));

    expect(response.status).toBe(200);
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
      data: { statusAssinatura: "ATIVA" },
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
          payment: { id: "payment-1", subscription: "subscription-1", status: "OVERDUE" },
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
      data: { statusAssinatura: "INADIMPLENTE" },
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
