import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/admin/usuarios/[id]/delete-info/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({ requireAdmin: vi.fn() }));
vi.mock("@asa/database", () => ({
  prisma: {
    consultor: { findUnique: vi.fn() },
    estabelecimento: { findMany: vi.fn() },
    usuarioEstabelecimento: { findMany: vi.fn() },
  },
}));

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);

function authenticate(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

describe("API admin/usuarios/:id/delete-info — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 sem autenticação", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v1/admin/usuarios/consultor-1?type=CONSULTOR"),
      { params: { id: "consultor-1" } },
    );

    expect(response.status).toBe(401);
    expect(prismaMock.consultor.findUnique).not.toHaveBeenCalled();
  });

  it("rejeita tipo inválido", async () => {
    authenticate();

    const response = await GET(
      new NextRequest("http://localhost/api/v1/admin/usuarios/x?type=OUTRO"),
      { params: { id: "x" } },
    );

    expect(response.status).toBe(400);
  });

  it("retorna contagens de consultor e estabelecimentos", async () => {
    authenticate();
    prismaMock.consultor.findUnique.mockResolvedValue({
      usuario: { cupomConfig: [{ id: "cupom-1" }, { id: "cupom-2" }] },
    } as Awaited<ReturnType<typeof prisma.consultor.findUnique>>);
    prismaMock.estabelecimento.findMany.mockResolvedValue([
      { id: "estab-1" },
      { id: "estab-2" },
    ] as Awaited<ReturnType<typeof prisma.estabelecimento.findMany>>);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/admin/usuarios/consultor-1?type=CONSULTOR"),
      { params: { id: "consultor-1" } },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      comissoesCount: 2,
      estabelecimentosCount: 2,
    });
  });

  it("retorna contagem de usuários do estabelecimento", async () => {
    authenticate();
    prismaMock.usuarioEstabelecimento.findMany.mockResolvedValue([
      { id: "usuario-1" },
    ] as Awaited<ReturnType<typeof prisma.usuarioEstabelecimento.findMany>>);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/admin/usuarios/estab-1?type=ESTABELECIMENTO"),
      { params: { id: "estab-1" } },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      usuariosEstabelecimentoCount: 1,
      comissoesCount: 0,
      estabelecimentosCount: 0,
    });
  });
});
