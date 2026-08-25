import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/backoffice/lembrete-financeiro/route";
import { requireBackoffice } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackoffice: vi.fn(),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    assinatura: { findUnique: vi.fn() },
    faturaAsaas: { findFirst: vi.fn() },
  },
}));

const requireBackofficeMock = vi.mocked(requireBackoffice);
const prismaMock = vi.mocked(prisma);

function authenticate(backofficeId: string | null = "backoffice-1"): void {
  requireBackofficeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE", backofficeId } },
    error: null,
  } as Awaited<ReturnType<typeof requireBackoffice>>);
}

describe("API backoffice/lembrete-financeiro — contrato funcional", () => {
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

  it("retorna mostrar=false quando a sessão não possui backoffice", async () => {
    authenticate(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mostrar: false });
    expect(prismaMock.assinatura.findUnique).not.toHaveBeenCalled();
  });

  it("retorna mostrar=false quando a unidade não possui assinatura", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mostrar: false });
    expect(prismaMock.faturaAsaas.findFirst).not.toHaveBeenCalled();
  });

  it("retorna mostrar=true enquanto existir fatura pendente (status Pendente no financeiro)", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue({ id: "assinatura-1" } as never);
    prismaMock.faturaAsaas.findFirst.mockResolvedValue({ id: "fatura-pendente" } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mostrar: true });
    expect(prismaMock.faturaAsaas.findFirst).toHaveBeenCalledWith({
      where: { assinaturaId: "assinatura-1", pagoManualmente: false },
      select: { id: true },
    });
  });

  it("retorna mostrar=false quando não há nenhuma fatura pendente", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue({ id: "assinatura-1" } as never);
    prismaMock.faturaAsaas.findFirst.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mostrar: false });
  });
});
