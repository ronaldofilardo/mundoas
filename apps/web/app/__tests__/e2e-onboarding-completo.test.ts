import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as criarBackofficeAdmin } from "@/app/api/v1/admin/backoffices/route";
import { POST as criarFaturaAdmin } from "@/app/api/v1/admin/backoffices/[id]/faturas/route";
import { GET as getTermosBackoffice, POST as postTermosBackoffice } from "@/app/api/v1/backoffice/onboarding/termos/route";
import { POST as postPlanoBackoffice } from "@/app/api/v1/backoffice/onboarding/plano/route";
import { POST as postCheckoutBackoffice } from "@/app/api/v1/backoffice/onboarding/checkout/route";
import { POST as webhookAsaas } from "@/app/api/webhooks/asaas/route";
import { GET as checkAcessoUnidade } from "@/app/api/internal/acesso-unidade/route";

import { requireAdmin, requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { TERMOS_VERSAO } from "@/lib/legal/mundoas-termos";
import {
  buscarOuCriarCustomer,
  criarSubscription,
  buscarPrimeiraFatura,
  buscarQrCodePix,
} from "@/lib/asaas/client";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  requireBackofficeWithScope: vi.fn(),
  badRequest: (msg: string) => Response.json({ error: msg }, { status: 400 }),
  notFound: (msg: string) => Response.json({ error: msg }, { status: 404 }),
  ok: (data: unknown) => Response.json(data, { status: 200 }),
  created: (data: unknown) => Response.json(data, { status: 201 }),
}));

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/asaas/client", () => ({
  buscarOuCriarCustomer: vi.fn(),
  criarSubscription: vi.fn(),
  buscarPrimeiraFatura: vi.fn(),
  buscarQrCodePix: vi.fn(),
}));

const { mockPrisma } = vi.hoisted(() => {
  const mPrisma = {
    $transaction: vi.fn(async (callback: any) => callback(mPrisma)),
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    backoffice: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    assinatura: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    faturaAsaas: {
      create: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    asaasWebhookEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  };
  return { mockPrisma: mPrisma };
});

vi.mock("@asa/database", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

const requireAdminMock = vi.mocked(requireAdmin);
const requireBackofficeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = mockPrisma;

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe("E2E Onboarding Completo — ADMIN + BACKOFFICE (Termos) + ASAAS (Pagamento)", () => {
  const BACKOFFICE_ID = "00000000-0000-0000-0000-000000000001";
  const USUARIO_ID = "00000000-0000-0000-0000-000000000002";
  const ASSINATURA_ID = "00000000-0000-0000-0000-000000000003";
  const ADMIN_ID = "00000000-0000-0000-0000-000000000099";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_SECRET = "internal-test-secret";
  });

  it("Segurança: rota /api/internal/acesso-unidade rejeita requisição sem x-internal-secret com 401", async () => {
    const req = new NextRequest(
      `http://localhost/api/internal/acesso-unidade?backofficeId=${BACKOFFICE_ID}`
    );
    const res = await checkAcessoUnidade(req);
    expect(res.status).toBe(401);
  });

  it("Passo 1: ADMIN cadastra a unidade no sistema -> nasce com PENDENTE_TERMOS", async () => {
    requireAdminMock.mockResolvedValue({
      session: { user: { id: ADMIN_ID, tipo: "ADMIN" } },
      error: null,
    } as any);

    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.backoffice.findUnique.mockResolvedValue(null);

    prismaMock.usuario.create.mockResolvedValue({
      id: USUARIO_ID,
      email: "franquia.sul@mundoas.com",
      nome: "Unidade Sul",
    } as any);

    prismaMock.backoffice.create.mockResolvedValue({
      id: BACKOFFICE_ID,
      nome: "Unidade Sul",
      cpf: "12345678901",
      usuarioId: USUARIO_ID,
    } as any);

    prismaMock.assinatura.create.mockResolvedValue({
      id: ASSINATURA_ID,
      backofficeId: BACKOFFICE_ID,
      statusAssinatura: "PENDENTE_TERMOS",
    } as any);

    const req = new NextRequest("http://localhost/api/v1/admin/backoffices", {
      method: "POST",
      body: JSON.stringify({
        nome: "Unidade Sul",
        email: "franquia.sul@mundoas.com",
        cpf: "123.456.789-01",
        cnpj: "12.345.678/0001-90",
        razaoSocial: "Sul Serviços Médicos LTDA",
      }),
    });

    const res = await criarBackofficeAdmin(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(BACKOFFICE_ID);

    // Valida que a assinatura foi criada com PENDENTE_TERMOS
    expect(prismaMock.assinatura.create).toHaveBeenCalledWith({
      data: {
        backofficeId: BACKOFFICE_ID,
        statusAssinatura: "PENDENTE_TERMOS",
      },
    });
  });

  it("Passo 2: Verificação de acesso para unidade em PENDENTE_TERMOS bloqueia e aponta para TERMOS", async () => {
    prismaMock.assinatura.findUnique.mockResolvedValue({
      statusAssinatura: "PENDENTE_TERMOS",
      cortesiaExpiraEm: null,
    } as any);

    const req = new NextRequest(
      `http://localhost/api/internal/acesso-unidade?backofficeId=${BACKOFFICE_ID}`,
      { headers: { "x-internal-secret": "internal-test-secret" } }
    );
    const res = await checkAcessoUnidade(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.liberado).toBe(false);
    expect(body.status).toBe("PENDENTE_TERMOS");
    expect(body.etapaOnboarding).toBe("TERMOS");
  });

  it("Passo 3: ADMIN tenta dar baixa em pagamento manual ANTES do aceite -> rejeitado com 400", async () => {
    requireAdminMock.mockResolvedValue({
      session: { user: { id: ADMIN_ID, tipo: "ADMIN" } },
      error: null,
    } as any);

    prismaMock.assinatura.findUnique.mockResolvedValue({
      id: ASSINATURA_ID,
      backofficeId: BACKOFFICE_ID,
      statusAssinatura: "PENDENTE_TERMOS",
    } as any);

    const req = new NextRequest(
      `http://localhost/api/v1/admin/backoffices/${BACKOFFICE_ID}/faturas`,
      {
        method: "POST",
        body: JSON.stringify({
          valor: 500,
          vencimento: "2026-10-10",
          pago: true,
        }),
      }
    );

    const res = await criarFaturaAdmin(req, { params: { id: BACKOFFICE_ID } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Esta unidade ainda não aceitou os termos de uso");
  });

  it("Passo 4: BACKOFFICE acessa e aceita os termos diretamente no sistema -> transita para PENDENTE_PAGAMENTO", async () => {
    requireBackofficeMock.mockResolvedValue({
      session: { user: { id: USUARIO_ID, tipo: "BACKOFFICE" } },
      backofficeId: BACKOFFICE_ID,
      error: null,
    } as any);

    // Consulta inicial: termos não aceitos
    prismaMock.assinatura.findUnique.mockResolvedValue({
      id: ASSINATURA_ID,
      statusAssinatura: "PENDENTE_TERMOS",
      termosAceitosEm: null,
      termosVersao: null,
    } as any);

    const getRes = await getTermosBackoffice();
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.jaAceitou).toBe(false);
    expect(getBody.statusAssinatura).toBe("PENDENTE_TERMOS");

    // Aceite dos 3 termos jurídicos pelo Backoffice
    prismaMock.assinatura.update.mockResolvedValue({
      id: ASSINATURA_ID,
      statusAssinatura: "PENDENTE_PAGAMENTO",
      termosVersao: TERMOS_VERSAO,
      termosAceitosEm: new Date(),
    } as any);

    const postReq = new NextRequest(
      "http://localhost/api/v1/backoffice/onboarding/termos",
      {
        method: "POST",
        headers: { "x-forwarded-for": "189.40.10.20" },
        body: JSON.stringify({
          aceiteTermosUso: true,
          aceitePrivacidade: true,
          aceiteDebitoRecorrente: true,
        }),
      }
    );

    const postRes = await postTermosBackoffice(postReq);
    expect(postRes.status).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.ok).toBe(true);
    expect(postBody.statusAssinatura).toBe("PENDENTE_PAGAMENTO");

    expect(prismaMock.assinatura.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ASSINATURA_ID },
        data: expect.objectContaining({
          statusAssinatura: "PENDENTE_PAGAMENTO",
          termosVersao: TERMOS_VERSAO,
        }),
      })
    );
  });

  it("Passo 5: Verificação de acesso após aceite dos termos aponta para PAGAMENTO", async () => {
    prismaMock.assinatura.findUnique.mockResolvedValue({
      statusAssinatura: "PENDENTE_PAGAMENTO",
      cortesiaExpiraEm: null,
    } as any);

    const req = new NextRequest(
      `http://localhost/api/internal/acesso-unidade?backofficeId=${BACKOFFICE_ID}`,
      { headers: { "x-internal-secret": "internal-test-secret" } }
    );
    const res = await checkAcessoUnidade(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.liberado).toBe(false);
    expect(body.status).toBe("PENDENTE_PAGAMENTO");
    expect(body.etapaOnboarding).toBe("PAGAMENTO");
  });

  it("Passo 6: BACKOFFICE escolhe plano e inicia checkout Asaas", async () => {
    requireBackofficeMock.mockResolvedValue({
      session: { user: { id: USUARIO_ID, tipo: "BACKOFFICE" } },
      backofficeId: BACKOFFICE_ID,
      error: null,
    } as any);

    // Escolha do plano MENSAL
    prismaMock.assinatura.update.mockResolvedValue({
      id: ASSINATURA_ID,
      planoAssinatura: "MENSAL",
    } as any);

    const reqPlano = new NextRequest(
      "http://localhost/api/v1/backoffice/onboarding/plano",
      {
        method: "POST",
        body: JSON.stringify({ plano: "MENSAL" }),
      }
    );
    const resPlano = await postPlanoBackoffice(reqPlano);
    expect(resPlano.status).toBe(200);

    // Checkout Asaas
    prismaMock.backoffice.findUnique.mockResolvedValue({
      id: BACKOFFICE_ID,
      nome: "Unidade Sul",
      cpf: "12345678901",
      usuario: { email: "franquia.sul@mundoas.com" },
      assinatura: {
        id: ASSINATURA_ID,
        asaasCustomerId: null,
        asaasSubscriptionId: null,
        planoAssinatura: "MENSAL",
        statusAssinatura: "PENDENTE_PAGAMENTO",
      },
    } as any);

    vi.mocked(buscarOuCriarCustomer).mockResolvedValue("cus_asaas_123" as any);
    vi.mocked(criarSubscription).mockResolvedValue({
      id: "sub_asaas_123",
      status: "ACTIVE",
    } as any);
    vi.mocked(buscarPrimeiraFatura).mockResolvedValue({
      id: "pay_asaas_123",
      value: 1200,
      dueDate: "2026-10-10",
      invoiceUrl: "https://asaas.com/fatura/123",
      bankSlipUrl: "https://asaas.com/boleto/123",
      status: "PENDING",
    } as any);
    vi.mocked(buscarQrCodePix).mockResolvedValue({
      encodedImage: "pix_base64_data",
      payload: "pix_copia_e_cola",
    } as any);

    prismaMock.faturaAsaas.upsert.mockResolvedValue({
      id: "fatura-1",
      asaasPaymentId: "pay_asaas_123",
    } as any);

    const reqCheckout = new NextRequest(
      "http://localhost/api/v1/backoffice/onboarding/checkout",
      {
        method: "POST",
        body: JSON.stringify({ metodoPagamento: "PIX" }),
      }
    );

    const resCheckout = await postCheckoutBackoffice(reqCheckout);
    expect(resCheckout.status).toBe(200);
    const bodyCheckout = await resCheckout.json();
    expect(bodyCheckout.fatura.id).toBe("pay_asaas_123");
    expect(bodyCheckout.pix.payload).toBe("pix_copia_e_cola");
  });

  it("Passo 7A: Confirmação via Webhook Asaas (PAYMENT_CONFIRMED) ativa a unidade", async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = "secret_webhook_123";

    prismaMock.assinatura.findFirst.mockResolvedValue({
      id: ASSINATURA_ID,
      statusAssinatura: "PENDENTE_PAGAMENTO",
    } as any);

    prismaMock.faturaAsaas.upsert.mockResolvedValue({} as any);
    prismaMock.assinatura.update.mockResolvedValue({
      id: ASSINATURA_ID,
      statusAssinatura: "ATIVA",
    } as any);

    const webhookReq = new NextRequest("http://localhost/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "secret_webhook_123",
      },
      body: JSON.stringify({
        event: "PAYMENT_CONFIRMED",
        payment: {
          id: "pay_asaas_123",
          subscription: "sub_asaas_123",
          status: "CONFIRMED",
          value: 1200,
          dueDate: "2026-10-10",
        },
      }),
    });

    const resWebhook = await webhookAsaas(webhookReq);
    expect(resWebhook.status).toBe(200);

    expect(prismaMock.assinatura.update).toHaveBeenCalledWith({
      where: { id: ASSINATURA_ID },
      data: { statusAssinatura: "ATIVA" },
    });
  });

  it("Passo 7B: Alternativa de ativação — Baixa manual pelo ADMIN com termos aceitos ativa a unidade", async () => {
    requireAdminMock.mockResolvedValue({
      session: { user: { id: ADMIN_ID, tipo: "ADMIN" } },
      error: null,
    } as any);

    prismaMock.assinatura.findUnique.mockResolvedValue({
      id: ASSINATURA_ID,
      backofficeId: BACKOFFICE_ID,
      statusAssinatura: "PENDENTE_PAGAMENTO",
    } as any);

    prismaMock.faturaAsaas.create.mockResolvedValue({
      id: "fatura-manual-1",
      valor: 1200,
    } as any);

    prismaMock.assinatura.update.mockResolvedValue({
      id: ASSINATURA_ID,
      statusAssinatura: "ATIVA",
    } as any);

    const req = new NextRequest(
      `http://localhost/api/v1/admin/backoffices/${BACKOFFICE_ID}/faturas`,
      {
        method: "POST",
        body: JSON.stringify({
          valor: 1200,
          vencimento: "2026-10-10",
          pago: true,
        }),
      }
    );

    const res = await criarFaturaAdmin(req, { params: { id: BACKOFFICE_ID } });
    expect(res.status).toBe(201);

    expect(prismaMock.assinatura.update).toHaveBeenCalledWith({
      where: { id: ASSINATURA_ID },
      data: { statusAssinatura: "ATIVA" },
    });
  });

  it("Passo 8: Verificação final de acesso — unidade com status ATIVA é plenamente liberada", async () => {
    prismaMock.assinatura.findUnique.mockResolvedValue({
      statusAssinatura: "ATIVA",
      cortesiaExpiraEm: null,
    } as any);

    const req = new NextRequest(
      `http://localhost/api/internal/acesso-unidade?backofficeId=${BACKOFFICE_ID}`,
      { headers: { "x-internal-secret": "internal-test-secret" } }
    );
    const res = await checkAcessoUnidade(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.liberado).toBe(true);
    expect(body.status).toBe("ATIVA");
    expect(body.etapaOnboarding).toBeUndefined();
  });
});
