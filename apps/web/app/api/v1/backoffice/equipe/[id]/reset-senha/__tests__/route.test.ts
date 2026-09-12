import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  handlers: {},
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      Response.json(data, { status: init?.status ?? 200 }),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    equipe: {
      findFirst: vi.fn(),
    },
    usuario: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (msg: string) => Response.json({ error: msg }, { status: 400 }),
  notFound: (msg: string) => Response.json({ error: msg }, { status: 404 }),
  ok: (data: unknown) => Response.json(data, { status: 200 }),
}));

import { POST } from "../route";
import { prisma } from "@/lib/db";
import { requireBackofficeWithScope } from "@/lib/api-helpers";

describe("POST /api/v1/backoffice/equipe/[id]/reset-senha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve rejeitar se o usuário não for backoffice", async () => {
    (requireBackofficeWithScope as any).mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await POST({} as any, { params: { id: "eq-1" } });
    expect(res.status).toBe(403);
  });

  it("deve retornar 404 se o membro da equipe não for encontrado", async () => {
    (requireBackofficeWithScope as any).mockResolvedValue({
      session: { user: { id: "bo-user-1" } },
      backofficeId: "bo-1",
      error: null,
    });
    (prisma.equipe.findFirst as any).mockResolvedValue(null);

    const res = await POST({} as any, { params: { id: "eq-inexistente" } });
    expect(res.status).toBe(404);
  });

  it("deve resetar senha, marcar senhaTemporaria e retornar link", async () => {
    (requireBackofficeWithScope as any).mockResolvedValue({
      session: { user: { id: "bo-user-1" } },
      backofficeId: "bo-1",
      error: null,
    });
    (prisma.equipe.findFirst as any).mockResolvedValue({
      id: "eq-1",
      nome: "Gestor João",
      usuario: {
        id: "u-1",
        email: "joao@gestor.com",
        senhaHash: "$2a$12$samplehash",
        status: "ATIVO",
      },
    });

    const res = await POST({} as any, { params: { id: "eq-1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.link).toContain("/redefinir-senha?token=");
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: "u-1" },
      data: {
        senhaTemporaria: true,
        atualizadoEm: expect.any(Date),
      },
    });
  });
});
