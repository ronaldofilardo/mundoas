import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/backoffice/producao/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  ok: (data: unknown) => Response.json(data),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  created: (data: unknown) => Response.json(data, { status: 201 }),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    equipe: { findMany: vi.fn() },
    consultorPf: { findMany: vi.fn() },
    procedimentoPF: { findMany: vi.fn(), count: vi.fn() },
    parceiro: { findMany: vi.fn() },
  },
}));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

describe("API backoffice/producao — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem escopo de backoffice", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/producao"));

    expect(response.status).toBe(401);
    expect(prismaMock.equipe.findMany).not.toHaveBeenCalled();
  });

  it("retorna produção vazia com paginação padrão e listas auxiliares", async () => {
    authenticate();
    prismaMock.equipe.findMany
      .mockResolvedValueOnce([{ id: "lider-1" }] as Awaited<ReturnType<typeof prisma.equipe.findMany>>)
      .mockResolvedValueOnce([] as Awaited<ReturnType<typeof prisma.equipe.findMany>>);
    prismaMock.consultorPf.findMany.mockResolvedValue([] as Awaited<ReturnType<typeof prisma.consultorPf.findMany>>);
    prismaMock.procedimentoPF.findMany
      .mockResolvedValueOnce([] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>)
      .mockResolvedValueOnce([] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>);
    prismaMock.procedimentoPF.count.mockResolvedValue(0);
    prismaMock.parceiro.findMany.mockResolvedValue([] as Awaited<ReturnType<typeof prisma.parceiro.findMany>>);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/producao"));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      procedimentos: [],
      parceiros: [],
      mesesDisponiveis: [],
      comerciais: [],
      consultoresPf: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
  });

  it("aplica filtros, escopo e paginação na consulta de produção", async () => {
    authenticate();
    prismaMock.equipe.findMany
      .mockResolvedValueOnce([{ id: "lider-1" }] as Awaited<ReturnType<typeof prisma.equipe.findMany>>)
      .mockResolvedValueOnce([] as Awaited<ReturnType<typeof prisma.equipe.findMany>>);
    prismaMock.consultorPf.findMany.mockResolvedValue([{ id: "consultor-1", nome: "Consultor" }] as Awaited<ReturnType<typeof prisma.consultorPf.findMany>>);
    prismaMock.procedimentoPF.findMany
      .mockResolvedValueOnce([
        { id: "proc-1", dataReferencia: new Date("2026-08-15T12:00:00Z"), valorTotal: 150 },
      ] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>)
      .mockResolvedValueOnce([
        { dataReferencia: new Date("2026-08-15T12:00:00Z") },
      ] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>);
    prismaMock.procedimentoPF.count.mockResolvedValue(3);
    prismaMock.parceiro.findMany.mockResolvedValue([{ id: "parceiro-1", nome: "Parceiro", cpf: "52998224725" }] as Awaited<ReturnType<typeof prisma.parceiro.findMany>>);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/producao?mesReferencia=2026-08&parceiroId=parceiro-1&consultorPfId=consultor-1&page=2&limit=1"));
    const body = (await response.json()) as Record<string, unknown>;
    const procedureQuery = vi.mocked(prisma.procedimentoPF.findMany).mock.calls[0]?.[0] as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({ page: 2, limit: 1, total: 3, totalPages: 3 });
    expect(body.mesesDisponiveis).toEqual(["2026-08"]);
    expect(procedureQuery).toMatchObject({ take: 1, skip: 1, where: { parceiroId: "parceiro-1", consultorPfId: "consultor-1" } });
    expect(procedureQuery.where).toHaveProperty("dataReferencia");
    expect(procedureQuery.where).toHaveProperty("OR");
  });
});
