import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/setores/route";
import { getSession, requireLiderancaWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@asa/database", () => ({
  prisma: {
    setor: { findMany: vi.fn() },
    regraComercial: { findUnique: vi.fn() },
    equipe: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/api-helpers", () => ({
  getSession: vi.fn(),
  requireLiderancaWithScope: vi.fn(),
  ok: (data: unknown) => Response.json(data),
  unauthorized: () => Response.json({ error: "Não autorizado" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
}));

const prismaMock = vi.mocked(prisma);
const getSessionMock = vi.mocked(getSession);
const requireLiderancaMock = vi.mocked(requireLiderancaWithScope);

function request(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/v1/setores${query}`);
}

describe("GET /api/v1/setores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1", tipo: "LIDERANCA" },
    } as never);
    requireLiderancaMock.mockResolvedValue({
      session: { user: { id: "user-1", tipo: "LIDERANCA" } },
      liderancaId: "lideranca-1",
      backofficeId: "backoffice-1",
      lideranca: { id: "lideranca-1" },
      error: null,
    } as never);
  });

  it("retorna 401 sem sessão e não consulta o banco", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(request("?origem=regras-consultores"));

    expect(response.status).toBe(401);
    expect(prismaMock.setor.findMany).not.toHaveBeenCalled();
    expect(prismaMock.regraComercial.findUnique).not.toHaveBeenCalled();
  });

  it("retorna somente setores compatíveis com itens customizados da regra", async () => {
    prismaMock.regraComercial.findUnique.mockResolvedValue({
      itens: [{ nome: "Recepção" }, { nome: "  Atendimento  " }],
    } as never);
    prismaMock.setor.findMany.mockResolvedValue([
      { id: "setor-recepcao", nome: "Recepção", descricao: null },
      { id: "setor-atendimento", nome: "Atendimento", descricao: null },
      { id: "setor-legado", nome: "CIRE Ativo", descricao: null },
    ] as never);

    const response = await GET(request("?origem=regras-consultores"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: "setor-recepcao", nome: "Recepção", descricao: null },
      { id: "setor-atendimento", nome: "Atendimento", descricao: null },
    ]);
    expect(requireLiderancaMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.regraComercial.findUnique).toHaveBeenCalledWith({
      where: { backofficeId: "backoffice-1" },
      select: {
        itens: {
          where: { tipo: "CUSTOM" },
          select: { nome: true, ordem: true },
          orderBy: { ordem: "asc" },
        },
      },
    });
    expect(prismaMock.setor.findMany).toHaveBeenCalledWith({
      where: {
        ativo: true,
        backofficeId: "backoffice-1",
      },
      select: { id: true, nome: true, descricao: true },
      orderBy: { nome: "asc" },
    });
  });

  it("retorna lista vazia quando não há itens customizados na regra", async () => {
    prismaMock.regraComercial.findUnique.mockResolvedValue({ itens: [] } as never);
    prismaMock.setor.findMany.mockResolvedValue([
      { id: "setor-legado", nome: "CIRE Ativo", descricao: null },
    ] as never);

    const response = await GET(request("?origem=regras-consultores"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("mantém a listagem geral sem o filtro de regra", async () => {
    const setores = [
      { id: "setor-global", nome: "Setor Global", descricao: null },
    ];
    prismaMock.equipe.findUnique.mockResolvedValue({
      backofficeId: "backoffice-1",
    } as never);
    prismaMock.setor.findMany.mockResolvedValue(setores as never);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(setores);
    expect(requireLiderancaMock).not.toHaveBeenCalled();
    expect(prismaMock.regraComercial.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.setor.findMany).toHaveBeenCalledWith({
      where: { ativo: true, backofficeId: "backoffice-1" },
      select: { id: true, nome: true, descricao: true },
      orderBy: { nome: "asc" },
    });
  });
});
