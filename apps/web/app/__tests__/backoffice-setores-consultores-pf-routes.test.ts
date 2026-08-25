import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getSetores } from "@/app/api/v1/backoffice/setores/route";
import { GET as getConsultoresPf } from "@/app/api/v1/backoffice/consultores-pf/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  unauthorized: () => Response.json({ error: "Não autorizado" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
  ok: (data: unknown) => Response.json(data),
  created: (data: unknown) => Response.json(data, { status: 201 }),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    setor: { findMany: vi.fn() },
    consultorPf: { findMany: vi.fn(), findFirst: vi.fn() },
    usuario: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({ hash: vi.fn().mockResolvedValue("hash-teste") }));
vi.mock("@/lib/utils", () => ({ gerarSenhaProvisoria: vi.fn().mockReturnValue("senha-teste") }));
vi.mock("@/lib/audit", () => ({ criarAuditLog: vi.fn().mockResolvedValue(undefined) }));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

function denyAccess(): void {
  scopeMock.mockResolvedValue({
    session: null,
    backofficeId: null,
    error: Response.json({ error: "Acesso negado" }, { status: 403 }),
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

describe("GET /api/v1/backoffice/setores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticate();
    prismaMock.setor.findMany.mockResolvedValue([
      { id: "s1", nome: "CIRE Ativo" },
      { id: "s2", nome: "CIRE Receptivo" },
    ] as never);
  });

  it("retorna 200 com lista de setores", async () => {
    const req = new NextRequest("http://localhost/api/v1/backoffice/setores");
    const res = await getSetores(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it("respeita query param ativo=false", async () => {
    const req = new NextRequest("http://localhost/api/v1/backoffice/setores?ativo=false");
    await getSetores(req as never);
    expect(prismaMock.setor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ativo: false }),
      }),
    );
  });

  it("usa ativo=true por padrão", async () => {
    const req = new NextRequest("http://localhost/api/v1/backoffice/setores");
    await getSetores(req as never);
    expect(prismaMock.setor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ativo: true }),
      }),
    );
  });

  it("filtra por backofficeId ou globais (null)", async () => {
    const req = new NextRequest("http://localhost/api/v1/backoffice/setores");
    await getSetores(req as never);
    expect(prismaMock.setor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ backofficeId: "backoffice-1" }, { backofficeId: null }],
        }),
      }),
    );
  });

  it("retorna 403 sem permissão", async () => {
    denyAccess();
    const req = new NextRequest("http://localhost/api/v1/backoffice/setores");
    const res = await getSetores(req as never);
    expect(res.status).toBe(403);
    expect(prismaMock.setor.findMany).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/backoffice/consultores-pf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticate();
    prismaMock.consultorPf.findMany.mockResolvedValue([] as never);
  });

  it("retorna 200 com lista vazia", async () => {
    const req = new NextRequest("http://localhost/api/v1/backoffice/consultores-pf");
    const res = await getConsultoresPf(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("aplica filtro liderancaId quando presente", async () => {
    const liderancaId = "2c7fbc68-1234-4abc-9def-000000000001";
    const req = new NextRequest(
      `http://localhost/api/v1/backoffice/consultores-pf?liderancaId=${liderancaId}`,
    );
    await getConsultoresPf(req as never);
    expect(prismaMock.consultorPf.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          liderancaId,
          lideranca: { backofficeId: "backoffice-1" },
        }),
      }),
    );
  });

  it("retorna 403 sem permissão", async () => {
    denyAccess();
    const req = new NextRequest("http://localhost/api/v1/backoffice/consultores-pf");
    const res = await getConsultoresPf(req as never);
    expect(res.status).toBe(403);
    expect(prismaMock.consultorPf.findMany).not.toHaveBeenCalled();
  });
});
