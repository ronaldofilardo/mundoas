import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    consultorPf: {
      findFirst: vi.fn(),
    },
    movimentacaoPontos: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
  requireLiderancaWithScope: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/api-helpers", async () => {
  const { NextResponse } = await import("next/server");
  return {
    requireLiderancaWithScope: mocks.requireLiderancaWithScope,
    badRequest: (message: string) =>
      NextResponse.json({ error: message }, { status: 400 }),
    notFound: (message: string) =>
      NextResponse.json({ error: message }, { status: 404 }),
    ok: (data: unknown) => NextResponse.json(data, { status: 200 }),
  };
});

import { GET as GETExtrato } from "../api/v1/lideranca/equipe/bonus/[consultorPfId]/extrato/route";

const backofficeId = "bo-lid-1";
const consultorPfId = "cpf-lid-1";

function extratoRequest(consultorId = consultorPfId, query = "") {
  return {
    req: new NextRequest(
      `http://localhost/api/v1/lideranca/equipe/bonus/${consultorId}/extrato${query}`,
    ),
    params: { consultorPfId: consultorId },
  };
}

describe("GET /api/v1/lideranca/equipe/bonus/[consultorPfId]/extrato", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireLiderancaWithScope.mockResolvedValue({
      session: { user: { id: "lider-1", tipo: "LIDERANCA" } },
      liderancaId: "lid-1",
      backofficeId,
      error: null,
    } as any);

    mocks.prisma.consultorPf.findFirst.mockResolvedValue({
      id: consultorPfId,
      nome: "Consultor 1",
      cpf: "12345678900",
      lideranca: { backofficeId },
    });

    mocks.prisma.movimentacaoPontos.findMany.mockResolvedValue([
      {
        id: "mov-1",
        tipo: "CREDITO",
        origem: "PRODUCAO_IMPORTADA",
        quantidade: 100,
        descricao: "Bônus",
        observacao: null,
        criadoEm: new Date("2026-08-01"),
        cicloPontos: { nome: "Ciclo 2026" },
      },
    ]);

    mocks.prisma.movimentacaoPontos.aggregate.mockImplementation(
      ({ where }: { where: { tipo: string } }) => {
        if (where.tipo === "CREDITO") {
          return Promise.resolve({ _sum: { quantidade: 100 } });
        }
        return Promise.resolve({ _sum: { quantidade: 0 } });
      },
    );
  });

  it("retorna 404 se consultor não pertence ao mesmo backoffice", async () => {
    mocks.prisma.consultorPf.findFirst.mockResolvedValueOnce({
      id: consultorPfId,
      nome: "Consultor Outro",
      cpf: "00000000000",
      lideranca: { backofficeId: "outro-bo" },
    });

    const { req, params } = extratoRequest();
    const res = await GETExtrato(req, { params });
    expect(res.status).toBe(404);
  });

  it("retorna histórico de movimentações e saldo do consultor", async () => {
    const { req, params } = extratoRequest();
    const res = await GETExtrato(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.consultor.id).toBe(consultorPfId);
    expect(body.saldoAtual).toBe(100);
    expect(body.movimentacoes).toHaveLength(1);
    expect(body.movimentacoes[0].tipo).toBe("CREDITO");
    expect(body.movimentacoes[0].ciclo).toBe("Ciclo 2026");
  });
});
