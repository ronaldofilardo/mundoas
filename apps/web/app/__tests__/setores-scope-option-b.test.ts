import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/setores/route";
import { getSession } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  getSession: vi.fn(),
  unauthorized: () => Response.json({ error: "Não autorizado" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
  ok: (data: unknown) => Response.json(data),
  requireLiderancaWithScope: vi.fn(),
}));

vi.mock("@/lib/setores-regras", () => ({
  buscarSetoresDaRegraConsultores: vi.fn(),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    setor: { findMany: vi.fn() },
    equipe: { findUnique: vi.fn() },
  },
}));

const sessionMock = vi.mocked(getSession);
const prismaMock = vi.mocked(prisma);

describe("GET /api/v1/setores — Opção B", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({
      user: { id: "usuario-1", backofficeId: null },
    } as never);
    prismaMock.equipe.findUnique.mockResolvedValue({
      backofficeId: "backoffice-1",
    } as never);
    prismaMock.setor.findMany.mockResolvedValue([
      { id: "setor-1", nome: "Setor A", descricao: null },
    ] as never);
  });

  it("resolve o backoffice pela equipe e filtra somente o próprio escopo", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/setores"));

    expect(response.status).toBe(200);
    expect(prismaMock.setor.findMany).toHaveBeenCalledWith({
      where: { ativo: true, backofficeId: "backoffice-1" },
      select: { id: true, nome: true, descricao: true },
      orderBy: { nome: "asc" },
    });
  });

  it("nega acesso quando o usuário não possui backoffice resolvível", async () => {
    prismaMock.equipe.findUnique.mockResolvedValue({ backofficeId: null } as never);

    const response = await GET(new NextRequest("http://localhost/api/v1/setores"));

    expect(response.status).toBe(403);
    expect(prismaMock.setor.findMany).not.toHaveBeenCalled();
  });
});
