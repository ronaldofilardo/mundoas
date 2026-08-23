import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/backoffice/liderancas/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import * as equipeRoute from "@/app/api/v1/backoffice/equipe/route";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: { equipe: { findMany: vi.fn() } },
}));

vi.mock("@/app/api/v1/backoffice/equipe/route", () => ({ POST: vi.fn() }));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);
const equipePostMock = vi.mocked(equipeRoute.POST);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

describe("API backoffice/liderancas — proxy funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem escopo", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/liderancas"));

    expect(response.status).toBe(401);
  });

  it("aplica filtros e retorna contadores no shape legado", async () => {
    authenticate();
    prismaMock.equipe.findMany.mockResolvedValue([
      {
        id: "lider-1",
        nome: "Liderança",
        cpf: "52998224725",
        tipoLideranca: "COMERCIAL",
        status: "ATIVO",
        createdAt: new Date("2026-01-01"),
        usuario: { id: "u-1", email: "lider@teste.com", status: "ATIVO" },
        _count: { subordinados: 3, gestores: 1 },
      },
    ] as Awaited<ReturnType<typeof prisma.equipe.findMany>>);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/backoffice/liderancas?tipo=COMERCIAL&status=ATIVO"),
    );
    const body = (await response.json()) as Array<{
      id: string;
      tipo: string;
      totalComerciais: number;
      totalGestores: number;
    }>;

    expect(response.status).toBe(200);
    expect(body).toEqual([
      expect.objectContaining({
        id: "lider-1",
        tipo: "COMERCIAL",
        totalComerciais: 3,
        totalGestores: 1,
      }),
    ]);
    expect(prismaMock.equipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          backofficeId: "backoffice-1",
          tipo: "LIDERANCA",
          tipoLideranca: "COMERCIAL",
          status: "ATIVO",
        },
      }),
    );
  });

  it("adapta POST legado de liderança comercial para equipe", async () => {
    equipePostMock.mockResolvedValue(Response.json({ id: "lider-1" }, { status: 201 }));

    const response = await POST(
      new NextRequest("http://localhost/api/v1/backoffice/liderancas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome: "Liderança", tipo: "COMERCIAL" }),
      }),
    );

    expect(response.status).toBe(201);
    const adaptedRequest = equipePostMock.mock.calls[0]?.[0];
    expect(await adaptedRequest?.json()).toMatchObject({
      nome: "Liderança",
      tipo: "LIDERANCA",
      tipoLideranca: "COMERCIAL",
    });
  });
});
