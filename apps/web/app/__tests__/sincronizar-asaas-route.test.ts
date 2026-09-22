import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/v1/admin/backoffices/[id]/assinatura/sincronizar-asaas/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    assinatura: { findUnique: vi.fn() },
    faturaAsaas: { upsert: vi.fn() },
  },
}));

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);
const params = { params: { id: "backoffice-1" } };

function auth() {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

function jsonRes(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("POST sincronizar-asaas — contingência de webhook perdido", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    process.env.ASAAS_API_KEY = "test-key";
    process.env.ASAAS_SANDBOX = "true";
  });

  it("401 sem autenticação", async () => {
    const res = await POST(new NextRequest("http://localhost/x"), params);
    expect(res.status).toBe(401);
  });

  it("sincroniza faturas avulsas por externalReference mesmo sem subscription", async () => {
    auth();
    prismaMock.assinatura.findUnique.mockResolvedValue({
      id: "assinatura-1",
      backofficeId: "backoffice-1",
      asaasSubscriptionId: null,
    } as never);

    fetchMock.mockResolvedValueOnce(
      jsonRes({
        data: [
          {
            id: "pay_avulsa_1",
            value: 250,
            dueDate: "2026-10-15",
            status: "RECEIVED",
            invoiceUrl: "https://go.asaas.com/a",
            paidDate: "2026-10-10",
          },
        ],
      }),
    );

    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sincronizadas).toBe(1);
    expect(body.baixas).toBe(1);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("externalReference=backoffice-1"),
      expect.anything(),
    );
    expect(prismaMock.faturaAsaas.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { asaasPaymentId: "pay_avulsa_1" },
        update: expect.objectContaining({
          statusPagamento: "RECEIVED",
          pagoEm: expect.any(Date),
        }),
      }),
    );
  });

  it("com subscription, busca as duas fontes e deduplica por id", async () => {
    auth();
    prismaMock.assinatura.findUnique.mockResolvedValue({
      id: "assinatura-1",
      backofficeId: "backoffice-1",
      asaasSubscriptionId: "sub_1",
    } as never);

    const pagamento = {
      id: "pay_sub_1",
      value: 100,
      dueDate: "2026-10-15",
      status: "PENDING",
    };

    fetchMock
      .mockResolvedValueOnce(jsonRes({ data: [pagamento] }))
      .mockResolvedValueOnce(jsonRes({ data: [pagamento, { ...pagamento, id: "pay_avulsa_1", status: "RECEIVED" }] }));

    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), params);
    const body = await res.json();

    expect(body.sincronizadas).toBe(2);
    expect(body.baixas).toBe(1);
    expect(prismaMock.faturaAsaas.upsert).toHaveBeenCalledTimes(2);
  });
});
