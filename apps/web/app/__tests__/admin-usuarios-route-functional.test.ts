import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/admin/usuarios/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultor: { findMany: vi.fn() },
    usuarioEstabelecimento: { findMany: vi.fn() },
    usuario: { findMany: vi.fn() },
  },
}));

type AdminSession = {
  user: { id: string; tipo: "ADMIN" };
};

type AuthResult = {
  session: AdminSession | null;
  error: Response | null;
};

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);

function authenticateAdmin(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

describe("API admin/usuarios — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 para sessão ausente", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(prismaMock.usuario.findMany).not.toHaveBeenCalled();
  });

  it("combina usuários, remove o gestor atual e ordena por nome", async () => {
    authenticateAdmin();
    prismaMock.consultor.findMany.mockResolvedValue([
      {
        id: "consultor-1",
        usuarioId: "usuario-consultor-1",
        cpf: "12345678901",
        usuario: {
          id: "usuario-consultor-1",
          email: "zeta@teste.com",
          nome: "Zeta Consultor",
          status: "ATIVO",
        },
      },
    ] as Awaited<ReturnType<typeof prisma.consultor.findMany>>);
    prismaMock.usuarioEstabelecimento.findMany.mockResolvedValue([
      {
        id: "estab-usuario-1",
        nome: "Alpha Estabelecimento",
        email: "alpha@teste.com",
        tipo: "PROPRIETARIO",
        ativo: true,
        estabelecimento: { nomeFantasia: "Alpha" },
      },
    ] as Awaited<ReturnType<typeof prisma.usuarioEstabelecimento.findMany>>);
    prismaMock.usuario.findMany.mockResolvedValue([
      {
        id: "gestor-2",
        nome: "Beta Gestor",
        email: "beta@teste.com",
        status: "ATIVO",
      },
    ] as Awaited<ReturnType<typeof prisma.usuario.findMany>>);

    const response = await GET();
    const body = (await response.json()) as {
      success: boolean;
      total: number;
      usuarios: Array<{ nome: string; hierarquia: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total).toBe(3);
    expect(body.usuarios.map((usuario) => usuario.nome)).toEqual([
      "Alpha Estabelecimento",
      "Beta Gestor",
      "Zeta Consultor",
    ]);
    expect(prismaMock.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tipo: "GESTOR", id: { not: "admin-1" } },
      }),
    );
  });
});
