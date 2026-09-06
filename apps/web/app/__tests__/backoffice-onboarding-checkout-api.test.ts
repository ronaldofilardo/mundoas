import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/v1/backoffice/onboarding/checkout/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import {
  buscarOuCriarCustomer,
  criarSubscription,
  buscarPrimeiraFatura,
  buscarQrCodePix,
} from "@/lib/asaas/client";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@/lib/asaas/client", () => ({
  buscarOuCriarCustomer: vi.fn(),
  criarSubscription: vi.fn(),
  buscarPrimeiraFatura: vi.fn(),
  buscarQrCodePix: vi.fn(),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    backoffice: { findUnique: vi.fn() },
    assinatura: { update: vi.fn() },
    faturaAsaas: { upsert: vi.fn() },
  },
}));

const requireBackofficeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);
const buscarOuCriarCustomerMock = vi.mocked(buscarOuCriarCustomer);
const criarSubscriptionMock = vi.mocked(criarSubscription);
const buscarPrimeiraFaturaMock = vi.mocked(buscarPrimeiraFatura);
const buscarQrCodePixMock = vi.mocked(buscarQrCodePix);

function authenticate(backofficeId: string = "backoffice-1"): void {
  requireBackofficeMock.mockResolvedValue({
    backofficeId,
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

describe("API backoffice/onboarding/checkout — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBackofficeMock.mockResolvedValue({
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem autenticação", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPagamento: "PIX" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("rejeita método de pagamento inválido", async () => {
    authenticate();

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPagamento: "INVALIDO" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Selecione um método de pagamento válido");
    expect(buscarOuCriarCustomerMock).not.toHaveBeenCalled();
  });

  it("bloqueia checkout sem plano escolhido", async () => {
    authenticate();
    prismaMock.backoffice.findUnique.mockResolvedValue({
      id: "backoffice-1",
      assinatura: { id: "assinatura-1", statusAssinatura: "PENDENTE_PAGAMENTO", planoAssinatura: null },
    } as never);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPagamento: "PIX" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Selecione um plano");
    expect(buscarOuCriarCustomerMock).not.toHaveBeenCalled();
  });

  it("bloqueia checkout se ainda não aceitou termos", async () => {
    authenticate();
    prismaMock.backoffice.findUnique.mockResolvedValue({
      id: "backoffice-1",
      assinatura: { id: "assinatura-1", statusAssinatura: "PENDENTE_TERMOS", planoAssinatura: "MENSAL" },
    } as never);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPagamento: "PIX" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("aceitar os termos");
    expect(buscarOuCriarCustomerMock).not.toHaveBeenCalled();
  });

  it("cria customer, subscription e fatura no Asaas e retorna dados de pagamento para PIX", async () => {
    authenticate();
    prismaMock.backoffice.findUnique.mockResolvedValue({
      id: "backoffice-1",
      razaoSocial: "Unidade Teste",
      cnpj: "12345678000199",
      telefone: "(11) 99999-9999",
      usuario: { email: "teste@asa.test" },
      assinatura: { id: "assinatura-1", statusAssinatura: "PENDENTE_PAGAMENTO", planoAssinatura: "MENSAL" },
    } as never);

    buscarOuCriarCustomerMock.mockResolvedValue({ id: "customer-1", name: "Unidade Teste", cpfCnpj: "12345678000199" } as never);
    criarSubscriptionMock.mockResolvedValue({ id: "subscription-1", status: "ACTIVE" } as never);
    buscarPrimeiraFaturaMock.mockResolvedValue({
      id: "payment-1",
      value: 350,
      dueDate: "2026-10-15",
      invoiceUrl: "https://asaas.com/invoice/1",
      bankSlipUrl: "https://asaas.com/boleto/1",
    } as never);
    buscarQrCodePixMock.mockResolvedValue({ encodedImage: "base64", payload: "pix-copia-cola" } as never);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPagamento: "PIX" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(buscarOuCriarCustomerMock).toHaveBeenCalledWith(
      expect.objectContaining({ cpfCnpj: "12345678000199" }),
    );
    expect(criarSubscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ value: 350 }),
    );
    expect(prismaMock.assinatura.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          asaasCustomerId: "customer-1",
          asaasSubscriptionId: "subscription-1",
        }),
      }),
    );
    expect(body.subscriptionId).toBe("subscription-1");
    expect(body.metodoPagamento).toBe("PIX");
    expect(body.fatura?.linkBoleto).toBe("https://asaas.com/boleto/1");
    expect(body.pix?.payload).toBe("pix-copia-cola");
  });

  it("retorna dados de fatura para boleto sem QR PIX", async () => {
    authenticate();
    prismaMock.backoffice.findUnique.mockResolvedValue({
      id: "backoffice-1",
      razaoSocial: "Unidade Teste",
      cnpj: "12345678000199",
      telefone: "(11) 99999-9999",
      usuario: { email: "teste@asa.test" },
      assinatura: { id: "assinatura-1", statusAssinatura: "PENDENTE_PAGAMENTO", planoAssinatura: "MENSAL" },
    } as never);

    buscarOuCriarCustomerMock.mockResolvedValue({ id: "customer-1", name: "Unidade Teste", cpfCnpj: "12345678000199" } as never);
    criarSubscriptionMock.mockResolvedValue({ id: "subscription-1", status: "ACTIVE" } as never);
    buscarPrimeiraFaturaMock.mockResolvedValue({
      id: "payment-1",
      value: 350,
      dueDate: "2026-10-15",
      bankSlipUrl: "https://asaas.com/boleto/1",
    } as never);
    buscarQrCodePixMock.mockResolvedValue(null);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPagamento: "BOLETO" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metodoPagamento).toBe("BOLETO");
    expect(body.fatura?.linkBoleto).toBe("https://asaas.com/boleto/1");
    expect(buscarQrCodePixMock).not.toHaveBeenCalled();
  });

  it("retorna 400 quando Asaas falha na criação do customer", async () => {
    authenticate();
    prismaMock.backoffice.findUnique.mockResolvedValue({
      id: "backoffice-1",
      razaoSocial: "Unidade Teste",
      cnpj: "12345678000199",
      telefone: "(11) 99999-9999",
      usuario: { email: "teste@asa.test" },
      assinatura: { id: "assinatura-1", statusAssinatura: "PENDENTE_PAGAMENTO", planoAssinatura: "MENSAL" },
    } as never);

    buscarOuCriarCustomerMock.mockRejectedValue(new Error("Asaas indisponível"));

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPagamento: "PIX" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Asaas indisponível");
  });
});
