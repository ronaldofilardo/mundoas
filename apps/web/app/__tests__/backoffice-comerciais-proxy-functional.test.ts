import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/backoffice/comerciais/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import * as equipeRoute from "@/app/api/v1/backoffice/equipe/route";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: { equipe: { findMany: vi.fn() } },
}));

vi.mock("@/app/api/v1/backoffice/equipe/route", () => ({
  POST: vi.fn(),
}));

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

describe("API backoffice/comerciais — proxy funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem escopo de backoffice", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(prismaMock.equipe.findMany).not.toHaveBeenCalled();
  });

  it("lista comerciais próprios e subordinados com shape legado", async () => {
    authenticate();
    prismaMock.equipe.findMany
      .mockResolvedValueOnce([
        {
          id: "lideranca-1",
          nome: "Liderança",
          cpf: "123",
          funcao: "LIDERANCA",
          percentualComissao: 10,
          status: "ATIVO",
          createdAt: new Date("2026-01-01"),
          liderancaId: null,
          tipoLideranca: "COMERCIAL",
          usuario: { id: "u-lider", email: "lider@teste.com", status: "ATIVO" },
          subordinados: [
            {
              id: "comercial-1",
              nome: "Comercial Subordinado",
              cpf: "456",
              funcao: "COMERCIAL",
              percentualComissao: 5,
              status: "ATIVO",
              createdAt: new Date("2026-01-02"),
              liderancaId: "lideranca-1",
              tipoLideranca: null,
              usuario: { id: "u-com", email: "com@teste.com", status: "ATIVO" },
            },
          ],
        },
      ] as Awaited<ReturnType<typeof prisma.equipe.findMany>>)
      .mockResolvedValueOnce([] as Awaited<ReturnType<typeof prisma.equipe.findMany>>);

    const response = await GET();
    const body = (await response.json()) as Array<{
      id: string;
      isLideranca: boolean;
      liderancaId: string | null;
    }>;

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "lideranca-1", isLideranca: true }),
        expect.objectContaining({ id: "comercial-1", isLideranca: false, liderancaId: "lideranca-1" }),
      ]),
    );
    expect(prismaMock.equipe.findMany).toHaveBeenCalledTimes(2);
  });

  it("adapta POST legado para equipe com tipo comercial", async () => {
    authenticate();
    equipePostMock.mockResolvedValue(Response.json({ id: "comercial-1" }, { status: 201 }));

    const response = await POST(
      new NextRequest("http://localhost/api/v1/backoffice/comerciais", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome: "Comercial", tipo: "COMERCIAL" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(equipePostMock).toHaveBeenCalledOnce();
    const adaptedRequest = equipePostMock.mock.calls[0]?.[0];
    expect(adaptedRequest).toBeInstanceOf(NextRequest);
    expect(await adaptedRequest?.json()).toMatchObject({
      nome: "Comercial",
      tipo: "COMERCIAL",
    });
  });
});
