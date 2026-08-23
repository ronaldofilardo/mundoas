import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/backoffice/assinatura/route";
import { requireBackoffice } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackoffice: vi.fn(),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: { assinatura: { findUnique: vi.fn() } },
}));

const requireBackofficeMock = vi.mocked(requireBackoffice);
const prismaMock = vi.mocked(prisma);

function authenticate(backofficeId: string | null = "backoffice-1"): void {
  requireBackofficeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE", backofficeId } },
    error: null,
  } as Awaited<ReturnType<typeof requireBackoffice>>);
}

describe("API backoffice/assinatura — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBackofficeMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackoffice>>);
  });

  it("retorna 401 sem autenticação", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(prismaMock.assinatura.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a sessão não possui backoffice", async () => {
    authenticate(null);

    const response = await GET();

    expect(response.status).toBe(404);
    expect(prismaMock.assinatura.findUnique).not.toHaveBeenCalled();
  });

  it("retorna semAssinatura quando a unidade não possui assinatura", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ semAssinatura: true });
  });

  it("retorna somente campos públicos da assinatura e das faturas", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue({
      statusAssinatura: "BLOQUEADA_MANUAL",
      motivoBloqueio: "Pendência",
      cortesiaExpiraEm: null,
      faturas: [
        {
          id: "fatura-1",
          valor: 150,
          vencimento: new Date("2026-09-01"),
          statusPagamento: "PENDING",
          pagoManualmente: false,
          pagoEm: null,
          asaasPaymentId: "interno-nao-expor",
        },
      ],
      asaasCustomerId: "interno-nao-expor",
    } as Awaited<ReturnType<typeof prisma.assinatura.findUnique>>);

    const response = await GET();
    const body = (await response.json()) as {
      semAssinatura: boolean;
      statusAssinatura: string;
      motivoBloqueio: string;
      faturas: Array<Record<string, unknown>>;
    };

    expect(response.status).toBe(200);
    expect(body.semAssinatura).toBe(false);
    expect(body.statusAssinatura).toBe("BLOQUEADA_MANUAL");
    expect(body.motivoBloqueio).toBe("Pendência");
    expect(body.faturas[0]).toEqual(
      expect.objectContaining({ id: "fatura-1", pago: false, statusPagamento: "PENDING" }),
    );
    expect(body.faturas[0]).not.toHaveProperty("asaasPaymentId");
    expect(body).not.toHaveProperty("asaasCustomerId");
  });
});
