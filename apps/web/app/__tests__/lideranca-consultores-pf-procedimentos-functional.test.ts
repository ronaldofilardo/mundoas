import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/lideranca/consultores-pf/producao/procedimentos/route";
import { requireLiderancaWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireLiderancaWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultorPf: { findMany: vi.fn() },
    procedimentoPF: { findMany: vi.fn(), count: vi.fn() },
  },
}));

const scopeMock = vi.mocked(requireLiderancaWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "lider-user", tipo: "LIDERANCA" } },
    liderancaId: "lider-1",
    error: null,
  } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
}

function request(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/v1/lideranca/consultores-pf/producao/procedimentos${query ? `?${query}` : ""}`);
}

describe("API lideranca/consultores-pf/producao/procedimentos — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      liderancaId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
  });

  it("retorna 401 sem escopo", async () => {
    const response = await GET(request("mesReferencia=2026-08"));

    expect(response.status).toBe(401);
  });

  it("retorna estrutura vazia quando não há consultores ativos", async () => {
    authenticate();
    prismaMock.consultorPf.findMany.mockResolvedValue([]);

    const response = await GET(request());
    const body = (await response.json()) as { procedimentos: unknown[]; pagination: Record<string, number> };

    expect(response.status).toBe(200);
    expect(body.procedimentos).toEqual([]);
    expect(body.pagination).toMatchObject({ page: 1, limit: 50, total: 0, totalPages: 0 });
    expect(prismaMock.procedimentoPF.findMany).not.toHaveBeenCalled();
  });

  it("aplica filtro de consultor, competência e paginação", async () => {
    authenticate();
    prismaMock.consultorPf.findMany.mockResolvedValue([
      { id: "consultor-1", nome: "Consultor", cpf: "52998224725" },
    ] as Awaited<ReturnType<typeof prisma.consultorPf.findMany>>);
    prismaMock.procedimentoPF.findMany
      .mockResolvedValueOnce([{ id: "proc-1", dataReferencia: new Date("2026-08-10") }] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>)
      .mockResolvedValueOnce([{ dataReferencia: new Date("2026-08-10") }] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>);
    prismaMock.procedimentoPF.count.mockResolvedValue(3);

    const response = await GET(request("mesReferencia=2026-08&consultorPfId=consultor-1&page=2&limit=1"));
    const body = (await response.json()) as { procedimentos: unknown[]; mesesDisponiveis: string[]; pagination: Record<string, number> };

    expect(response.status).toBe(200);
    expect(body.procedimentos).toHaveLength(1);
    expect(body.mesesDisponiveis).toEqual(["2026-08"]);
    expect(body.pagination).toMatchObject({ page: 2, limit: 1, total: 3, totalPages: 3 });
    expect(prismaMock.procedimentoPF.count).toHaveBeenCalledWith({ where: expect.objectContaining({ consultorPfId: "consultor-1" }) });
  });
});
