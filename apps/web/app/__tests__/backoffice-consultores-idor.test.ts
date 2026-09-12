import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PATCH } from "@/app/api/v1/backoffice/consultores/[id]/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";

const { mockPrisma } = vi.hoisted(() => {
  const mPrisma = {
    consultor: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    usuario: {
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => cb(mPrisma)),
  };
  return { mockPrisma: mPrisma };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@asa/database", () => ({ prisma: mockPrisma }));

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = mockPrisma;

describe("API backoffice/consultores/[id] — Isolamento de Tenant (Anti-IDOR)", () => {
  const BACKOFFICE_ID = "backoffice-tenant-1";
  const params = Promise.resolve({ id: "consultor-id-123" });

  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: { user: { id: "user-1", tipo: "BACKOFFICE" } },
      backofficeId: BACKOFFICE_ID,
      error: null,
    } as any);
  });

  it("GET: Rejeita com 404 quando consultor pertence a outro backoffice ou não existe", async () => {
    prismaMock.consultor.findFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/backoffice/consultores/consultor-id-123");
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
    expect(prismaMock.consultor.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "consultor-id-123",
          OR: expect.arrayContaining([
            expect.objectContaining({
              gestoresAtribuicoes: expect.objectContaining({
                some: expect.objectContaining({
                  gestor: expect.objectContaining({
                    equipe: expect.objectContaining({ backofficeId: BACKOFFICE_ID }),
                  }),
                }),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it("GET: Permite acesso quando consultor pertence ao backoffice solicitante", async () => {
    prismaMock.consultor.findFirst.mockResolvedValue({
      id: "consultor-id-123",
      usuarioId: "user-c-1",
      usuario: { id: "user-c-1", nome: "Consultor Válido", email: "c@mundoas.com" },
    });

    const req = new NextRequest("http://localhost/api/v1/backoffice/consultores/consultor-id-123");
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("consultor-id-123");
  });

  it("PATCH: Rejeita alteração com 404 se consultor pertencer a outro tenant", async () => {
    prismaMock.consultor.findFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/backoffice/consultores/consultor-id-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "Nome Fraudulento" }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(404);
    expect(prismaMock.usuario.update).not.toHaveBeenCalled();
  });
});
