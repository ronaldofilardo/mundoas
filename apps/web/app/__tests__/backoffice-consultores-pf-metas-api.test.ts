import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/backoffice/consultores-pf/[id]/metas/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultorPf: { findFirst: vi.fn() },
    metaConsultorPf: { findMany: vi.fn() },
  },
}));

const requireBackofficeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(backofficeId: string = "backoffice-1"): void {
  requireBackofficeMock.mockResolvedValue({
    backofficeId,
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

describe("API backoffice/consultores-pf/[id]/metas — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBackofficeMock.mockResolvedValue({
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem autenticação", async () => {
    const response = await GET(new NextRequest("http://localhost"), { params: { id: "c-1" } });

    expect(response.status).toBe(401);
    expect(prismaMock.consultorPf.findFirst).not.toHaveBeenCalled();
  });

  it("retorna 404 quando consultor não pertence à unidade", async () => {
    authenticate();
    prismaMock.consultorPf.findFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), { params: { id: "c-1" } });

    expect(response.status).toBe(404);
    expect(prismaMock.metaConsultorPf.findMany).not.toHaveBeenCalled();
  });

  it("retorna metas do consultor ordenadas por createdAt desc", async () => {
    authenticate();
    prismaMock.consultorPf.findFirst.mockResolvedValue({ id: "c-1" } as never);
    prismaMock.metaConsultorPf.findMany.mockResolvedValue([
      { id: "m2", consultorPfId: "c-1", createdAt: new Date("2026-09-01") },
      { id: "m1", consultorPfId: "c-1", createdAt: new Date("2026-08-01") },
    ] as never);

    const response = await GET(new NextRequest("http://localhost"), { params: { id: "c-1" } });

    expect(response.status).toBe(200);
    expect(prismaMock.metaConsultorPf.findMany).toHaveBeenCalledWith({
      where: { consultorPfId: "c-1" },
      orderBy: { createdAt: "desc" },
    });
    const body = await response.json();
    expect(body).toEqual({
      consultorPfId: "c-1",
      metas: [
        { id: "m2", consultorPfId: "c-1", createdAt: "2026-09-01T00:00:00.000Z" },
        { id: "m1", consultorPfId: "c-1", createdAt: "2026-08-01T00:00:00.000Z" },
      ],
    });
  });
});
