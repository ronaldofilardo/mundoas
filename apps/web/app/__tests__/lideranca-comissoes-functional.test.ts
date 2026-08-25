import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/lideranca/comissoes/route";
import { requireLiderancaWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireLiderancaWithScope: vi.fn(),
  badRequest: (message: string) =>
    Response.json({ error: message }, { status: 400 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    comissaoConsultorPf: { aggregate: vi.fn() },
  },
}));

const scopeMock = vi.mocked(requireLiderancaWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(liderancaId = "lideranca-1"): void {
  scopeMock.mockResolvedValue({
    session: { user: { tipo: "LIDERANCA" } },
    liderancaId,
    backofficeId: null,
    lideranca: { id: liderancaId },
    error: null,
  } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
}

function request(query = ""): NextRequest {
  return new NextRequest(
    `http://localhost/api/v1/lideranca/comissoes${query ? `?${query}` : ""}`,
  );
}

describe("API lideranca/comissoes — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      liderancaId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
  });

  it("retorna 401 sem liderança autenticada", async () => {
    const response = await GET(request("mesReferencia=2026-08"));

    expect(response.status).toBe(401);
    expect(prismaMock.comissaoConsultorPf.aggregate).not.toHaveBeenCalled();
  });

  it("retorna 400 para mesReferencia inválido", async () => {
    authenticate();

    const response = await GET(request("mesReferencia=2026-13"));

    expect(response.status).toBe(400);
    expect(prismaMock.comissaoConsultorPf.aggregate).not.toHaveBeenCalled();
  });

  it("agrega comissões da equipe no mês informado", async () => {
    authenticate();
    prismaMock.comissaoConsultorPf.aggregate.mockResolvedValue({
      _sum: { valorComissao: 1234.56, valorProducao: 9876.54 },
      _count: { _all: 3 },
    } as Awaited<ReturnType<typeof prisma.comissaoConsultorPf.aggregate>>);

    const response = await GET(request("mesReferencia=2026-08"));
    const body = (await response.json()) as {
      mesReferencia: string;
      comissaoMes: number;
      producaoMes: number;
      totalRegistros: number;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      mesReferencia: "2026-08",
      comissaoMes: 1234.56,
      producaoMes: 9876.54,
      totalRegistros: 3,
    });
    expect(prismaMock.comissaoConsultorPf.aggregate).toHaveBeenCalledWith({
      where: {
        mesReferencia: "2026-08",
        consultorPf: { liderancaId: "lideranca-1" },
      },
      _sum: { valorComissao: true, valorProducao: true },
      _count: { _all: true },
    });
  });

  it("usa o mês atual quando mesReferencia é omitido", async () => {
    authenticate();
    prismaMock.comissaoConsultorPf.aggregate.mockResolvedValue({
      _sum: { valorComissao: null, valorProducao: null },
      _count: { _all: 0 },
    } as Awaited<ReturnType<typeof prisma.comissaoConsultorPf.aggregate>>);

    const response = await GET(request());
    const body = (await response.json()) as { mesReferencia: string; comissaoMes: number };

    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

    expect(response.status).toBe(200);
    expect(body.mesReferencia).toBe(mesAtual);
    expect(body.comissaoMes).toBe(0);
  });

  it("retorna zeros quando a equipe não tem comissões no mês", async () => {
    authenticate();
    prismaMock.comissaoConsultorPf.aggregate.mockResolvedValue({
      _sum: { valorComissao: null, valorProducao: null },
      _count: { _all: 0 },
    } as Awaited<ReturnType<typeof prisma.comissaoConsultorPf.aggregate>>);

    const response = await GET(request("mesReferencia=2026-08"));
    const body = (await response.json()) as {
      comissaoMes: number;
      producaoMes: number;
      totalRegistros: number;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ comissaoMes: 0, producaoMes: 0, totalRegistros: 0 });
  });
});
