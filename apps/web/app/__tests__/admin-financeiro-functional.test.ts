import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/admin/financeiro/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    assinatura: { findMany: vi.fn() },
    faturaAsaas: { findMany: vi.fn() },
  },
}));

type AdminAuth = {
  session: { user: { id: string; tipo: "ADMIN" } } | null;
  error: Response | null;
};

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);

function authenticate(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

describe("API admin/financeiro — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 sem autenticação", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(prismaMock.assinatura.findMany).not.toHaveBeenCalled();
  });

  it("calcula resumo por status, vencidos, pagos e MRR", async () => {
    authenticate();
    prismaMock.assinatura.findMany.mockResolvedValue([
      { id: "assinatura-ativa", statusAssinatura: "ATIVA", backoffice: { nome: "Alpha" } },
      { id: "assinatura-cortesia", statusAssinatura: "CORTESIA", backoffice: { nome: "Beta" } },
    ] as Awaited<ReturnType<typeof prisma.assinatura.findMany>>);
    const overdueDate = new Date(Date.now() - 86_400_000);
    prismaMock.faturaAsaas.findMany
      .mockResolvedValueOnce([
        {
          id: "fatura-vencida",
          valor: 150,
          vencimento: overdueDate,
          statusPagamento: "OVERDUE",
          assinatura: { backoffice: { nome: "Alpha" } },
        },
      ] as Awaited<ReturnType<typeof prisma.faturaAsaas.findMany>>)
      .mockResolvedValueOnce([
        {
          id: "fatura-paga",
          valor: 200,
          pagoEm: new Date(),
          assinatura: { backoffice: { nome: "Alpha" } },
        },
      ] as Awaited<ReturnType<typeof prisma.faturaAsaas.findMany>>)
      .mockResolvedValueOnce([
        { id: "fatura-mrr", assinaturaId: "assinatura-ativa", valor: 300 },
      ] as Awaited<ReturnType<typeof prisma.faturaAsaas.findMany>>);

    const response = await GET();
    const body = (await response.json()) as {
      porStatus: Record<string, number>;
      totalUnidades: number;
      mrrEstimado: number;
      faturasEmAberto: number;
      faturasVencidas: Array<{ id: string; unidade: string }>;
      ultimasPagas: Array<{ id: string; unidade: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.porStatus.ATIVA).toBe(1);
    expect(body.porStatus.CORTESIA).toBe(1);
    expect(body.totalUnidades).toBe(2);
    expect(body.mrrEstimado).toBe(300);
    expect(body.faturasEmAberto).toBe(1);
    expect(body.faturasVencidas).toEqual([
      expect.objectContaining({ id: "fatura-vencida", unidade: "Alpha" }),
    ]);
    expect(body.ultimasPagas).toEqual([
      expect.objectContaining({ id: "fatura-paga", unidade: "Alpha" }),
    ]);
  });
});
