import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "@/app/api/v1/admin/usuarios/[id]/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({ requireAdmin: vi.fn() }));

vi.mock("@asa/database", () => ({
  prisma: {
    consultor: { findUnique: vi.fn(), delete: vi.fn() },
    estabelecimento: { deleteMany: vi.fn() },
    usuario: { delete: vi.fn() },
    usuarioEstabelecimento: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

type AdminAuth = {
  session: { user: { id: string; tipo: "ADMIN" } } | null;
  error: Response | null;
};

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);
const params = { params: { id: "entidade-1" } };

function authenticate(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

function request(type: string, body: unknown = {}): NextRequest {
  return new NextRequest(
    `http://localhost/api/v1/admin/usuarios/entidade-1?type=${type}`,
    {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

describe("API admin/usuarios/:id DELETE — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 e não toca no banco sem autenticação", async () => {
    const response = await DELETE(request("CONSULTOR"), params);

    expect(response.status).toBe(401);
    expect(prismaMock.consultor.findUnique).not.toHaveBeenCalled();
  });

  it("rejeita tipo desconhecido", async () => {
    authenticate();

    const response = await DELETE(request("OUTRO"), params);

    expect(response.status).toBe(400);
  });

  it("retorna 404 para consultor inexistente", async () => {
    authenticate();
    prismaMock.consultor.findUnique.mockResolvedValue(null);

    const response = await DELETE(request("CONSULTOR"), params);

    expect(response.status).toBe(404);
  });

  it("remove estabelecimentos, consultor e usuário associado", async () => {
    authenticate();
    prismaMock.consultor.findUnique.mockResolvedValue({
      id: "consultor-1",
      usuarioId: "usuario-1",
    } as Awaited<ReturnType<typeof prisma.consultor.findUnique>>);

    const response = await DELETE(
      request("CONSULTOR", { deleteEstabelecimentos: true }),
      { params: { id: "consultor-1" } },
    );

    expect(response.status).toBe(200);
    expect(prismaMock.estabelecimento.deleteMany).toHaveBeenCalledWith({
      where: { consultorId: "consultor-1" },
    });
    expect(prismaMock.consultor.delete).toHaveBeenCalledWith({
      where: { id: "consultor-1" },
    });
    expect(prismaMock.usuario.delete).toHaveBeenCalledWith({
      where: { id: "usuario-1" },
    });
  });

  it("remove usuário de estabelecimento existente", async () => {
    authenticate();
    prismaMock.usuarioEstabelecimento.findUnique.mockResolvedValue({
      id: "estab-usuario-1",
    } as Awaited<ReturnType<typeof prisma.usuarioEstabelecimento.findUnique>>);

    const response = await DELETE(
      request("ESTABELECIMENTO"),
      { params: { id: "estab-usuario-1" } },
    );

    expect(response.status).toBe(200);
    expect(prismaMock.usuarioEstabelecimento.delete).toHaveBeenCalledWith({
      where: { id: "estab-usuario-1" },
    });
  });
});
