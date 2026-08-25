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
    backoffice: { findMany: vi.fn() },
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

  it("combina usuários (gestores, consultores, backoffices), remove o gestor atual e ordena por nome", async () => {
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
          telefone: "11999999999",
          tipo: "CONSULTOR",
          papel: "CONSULTOR",
          criadoEm: new Date("2024-01-15"),
        },
      },
    ] as Awaited<ReturnType<typeof prisma.consultor.findMany>>);
    prismaMock.usuario.findMany.mockResolvedValue([
      {
        id: "gestor-2",
        nome: "Beta Gestor",
        email: "beta@teste.com",
        status: "ATIVO",
        telefone: "11888888888",
        tipo: "GESTOR",
        papel: "GESTOR_PJ",
        criadoEm: new Date("2024-01-10"),
      },
    ] as Awaited<ReturnType<typeof prisma.usuario.findMany>>);
    prismaMock.backoffice.findMany.mockResolvedValue([
      {
        id: "backoffice-1",
        usuarioId: "usuario-backoffice-1",
        cpf: "98765432100",
        percentualComissaoDefault: 5.00,
        percentualComissaoMax: 100.00,
        usuario: {
          id: "usuario-backoffice-1",
          email: "alpha@teste.com",
          nome: "Alpha Backoffice",
          status: "ATIVO",
          telefone: "11777777777",
          tipo: "BACKOFFICE",
          papel: "BACKOFFICE",
          criadoEm: new Date("2024-01-05"),
        },
      },
    ] as Awaited<ReturnType<typeof prisma.backoffice.findMany>>);

    const response = await GET();
    const body = (await response.json()) as {
      success: boolean;
      total: number;
      usuarios: Array<{ 
        nome: string; 
        hierarquia: string; 
        telefone: string | null;
        papel: string | null;
        percentualComissaoDefault?: number;
        percentualComissaoMax?: number;
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total).toBe(3);
    // Ordered by nome: Alpha Backoffice, Beta Gestor, Zeta Consultor
    expect(body.usuarios.map((usuario) => usuario.nome)).toEqual([
      "Alpha Backoffice",
      "Beta Gestor",
      "Zeta Consultor",
    ]);
    // Backoffice has extra fields
    const bo = body.usuarios.find(u => u.nome === "Alpha Backoffice");
    expect(bo?.tipo).toBe("BACKOFFICE");
    expect(bo?.percentualComissaoDefault).toBe(5);
    expect(bo?.percentualComissaoMax).toBe(100);
    expect(bo?.telefone).toBe("11777777777");
    expect(bo?.papel).toBe("BACKOFFICE");
    expect(prismaMock.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tipo: "GESTOR", id: { not: "admin-1" } },
      }),
    );
    expect(prismaMock.backoffice.findMany).toHaveBeenCalled();
  });
});
