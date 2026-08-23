import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST, GET } from "@/app/api/v1/admin/backoffices/[id]/faturas/route";
import { PATCH } from "@/app/api/v1/admin/backoffices/[id]/faturas/[faturaId]/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  created: (data: unknown) => Response.json(data, { status: 201 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    assinatura: { findUnique: vi.fn(), update: vi.fn() },
    faturaAsaas: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({ criarAuditLog: vi.fn().mockResolvedValue(undefined) }));

type AdminAuth = {
  session: { user: { id: string; tipo: "ADMIN" } } | null;
  error: Response | null;
};

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);
const backofficeParams = { params: { id: "backoffice-1" } };
const faturaParams = { params: { id: "backoffice-1", faturaId: "fatura-1" } };

function authenticate(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/backoffices/backoffice-1/faturas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("APIs admin/backoffices/:id/faturas — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 na criação sem autenticação", async () => {
    const response = await POST(request({ valor: 100, vencimento: "2026-09-01" }), backofficeParams);

    expect(response.status).toBe(401);
  });

  it("valida valor e vencimento antes do banco", async () => {
    authenticate();

    const response = await POST(request({ valor: 0 }), backofficeParams);

    expect(response.status).toBe(400);
    expect(prismaMock.assinatura.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 404 quando não existe assinatura", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue(null);

    const response = await POST(
      request({ valor: 100, vencimento: "2026-09-01" }),
      backofficeParams,
    );

    expect(response.status).toBe(404);
  });

  it("cria fatura pendente para a assinatura da unidade", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue({ id: "assinatura-1" } as Awaited<
      ReturnType<typeof prisma.assinatura.findUnique>
    >);
    prismaMock.faturaAsaas.create.mockResolvedValue({
      id: "fatura-1",
      statusPagamento: "PENDING",
      valor: 100,
    } as Awaited<ReturnType<typeof prisma.faturaAsaas.create>>);

    const response = await POST(
      request({ valor: 100, vencimento: "2026-09-01" }),
      backofficeParams,
    );

    expect(response.status).toBe(201);
    expect(prismaMock.faturaAsaas.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assinaturaId: "assinatura-1",
          statusPagamento: "PENDING",
          valor: 100,
        }),
      }),
    );
  });

  it("lista faturas da assinatura da unidade", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue({ id: "assinatura-1" } as Awaited<
      ReturnType<typeof prisma.assinatura.findUnique>
    >);
    const invoices = [{ id: "fatura-1", assinaturaId: "assinatura-1" }] as Awaited<
      ReturnType<typeof prisma.faturaAsaas.findMany>
    >;
    prismaMock.faturaAsaas.findMany.mockResolvedValue(invoices);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/admin/backoffices/backoffice-1/faturas"),
      backofficeParams,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(invoices);
  });

  it("rejeita atualização com payload pago não booleano", async () => {
    authenticate();

    const response = await PATCH(
      new NextRequest("http://localhost/api/v1/admin/backoffices/backoffice-1/faturas/fatura-1", {
        method: "PATCH",
        body: JSON.stringify({ pago: "sim" }),
      }),
      faturaParams,
    );

    expect(response.status).toBe(400);
    expect(prismaMock.faturaAsaas.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a fatura não pertence à unidade", async () => {
    authenticate();
    prismaMock.faturaAsaas.findUnique.mockResolvedValue({
      id: "fatura-1",
      assinaturaId: "assinatura-1",
      assinatura: { backofficeId: "outro-backoffice" },
    } as Awaited<ReturnType<typeof prisma.faturaAsaas.findUnique>>);

    const response = await PATCH(
      new NextRequest("http://localhost/api/v1/admin/backoffices/backoffice-1/faturas/fatura-1", {
        method: "PATCH",
        body: JSON.stringify({ pago: true }),
      }),
      faturaParams,
    );

    expect(response.status).toBe(404);
  });

  it("marca fatura como paga dentro de transação", async () => {
    authenticate();
    prismaMock.faturaAsaas.findUnique.mockResolvedValue({
      id: "fatura-1",
      assinaturaId: "assinatura-1",
      assinatura: { backofficeId: "backoffice-1" },
    } as Awaited<ReturnType<typeof prisma.faturaAsaas.findUnique>>);
    const transactionClient = {
      faturaAsaas: {
        update: vi.fn().mockResolvedValue({ id: "fatura-1", statusPagamento: "CONFIRMED" }),
      },
      assinatura: {
        findUnique: vi.fn().mockResolvedValue({ statusAssinatura: "ATIVA" }),
        update: vi.fn(),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(transactionClient));

    const response = await PATCH(
      new NextRequest("http://localhost/api/v1/admin/backoffices/backoffice-1/faturas/fatura-1", {
        method: "PATCH",
        body: JSON.stringify({ pago: true }),
      }),
      faturaParams,
    );

    expect(response.status).toBe(200);
    expect(transactionClient.faturaAsaas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ statusPagamento: "CONFIRMED", pagoManualmente: true }),
      }),
    );
  });
});
