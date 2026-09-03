import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    cicloPontos: {
      findFirst: vi.fn(),
    },
    equipe: {
      findMany: vi.fn(),
    },
    consultorPf: {
      findFirst: vi.fn(),
    },
    movimentacaoPontos: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    procedimentoPF: {
      groupBy: vi.fn(),
    },
    solicitacaoResgate: {
      groupBy: vi.fn(),
    },
  },
  requireBackofficeWithScope: vi.fn(),
}));

vi.mock("@asa/database", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/api-helpers", async () => {
  const { NextResponse } = await import("next/server");
  return {
    requireBackofficeWithScope: mocks.requireBackofficeWithScope,
    badRequest: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
    notFound: (message: string) => NextResponse.json({ error: message }, { status: 404 }),
    ok: (data: unknown) => NextResponse.json(data, { status: 200 }),
  };
});

vi.mock("@/lib/pontos-utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pontos-utils")>("@/lib/pontos-utils");
  return {
    ...actual,
    obterCicloBonusConsultorPf: vi.fn(),
  };
});

import { GET as GETBonus } from "../api/v1/backoffice/equipe/bonus/route";
import { GET as GETExtrato } from "../api/v1/backoffice/equipe/bonus/[consultorPfId]/extrato/route";
import { obterCicloBonusConsultorPf } from "@/lib/pontos-utils";

const backofficeId = "bo-1";
const gestorEquipeId = "gestor-1";
const consultorPfId = "cpf-1";

function bonusRequest(query?: string) {
  return new NextRequest(`http://localhost/api/v1/backoffice/equipe/bonus${query ?? ""}`);
}

function extratoRequest(consultorPfId: string, query?: string) {
  return new NextRequest(`http://localhost/api/v1/backoffice/equipe/bonus/${consultorPfId}/extrato${query ?? ""}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireBackofficeWithScope.mockResolvedValue({ backofficeId, session: {}, error: null });
  mocks.prisma.cicloPontos.findFirst.mockResolvedValue({
    id: "ciclo-vigente",
    nome: "Ciclo 2026",
    status: "EM_ANDAMENTO",
  });
  (mocks.prisma.equipe.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
    {
      id: gestorEquipeId,
      nome: "Gestor A",
      consultorPfs: [
        { id: consultorPfId, nome: "Consultor PF 1", cpf: "12345678900", status: "ATIVO" },
      ],
    },
  ]);
  mocks.prisma.movimentacaoPontos.findMany.mockResolvedValue([
    { consultorPfId, tipo: "CREDITO", quantidade: 10, descricao: null, criadoEm: new Date("2026-08-01T00:00:00.000Z"), cicloPontos: { nome: "Ciclo 2026" } },
    { consultorPfId, tipo: "DEBITO", quantidade: 2, descricao: null, criadoEm: new Date("2026-08-02T00:00:00.000Z"), cicloPontos: { nome: "Ciclo 2026" } },
  ]);
  mocks.prisma.procedimentoPF.groupBy.mockResolvedValue([
    { consultorPfId, _max: { dataReferencia: new Date("2026-08-01T00:00:00.000Z") } },
  ]);
  mocks.prisma.solicitacaoResgate.groupBy.mockResolvedValue([
    { consultorPfId, _count: { id: 1 } },
  ]);
  mocks.prisma.consultorPf.findFirst.mockResolvedValue({
    id: consultorPfId,
    nome: "Consultor PF 1",
    cpf: "12345678900",
    lideranca: { backofficeId },
  });
  mocks.prisma.movimentacaoPontos.aggregate.mockResolvedValue({ _sum: { quantidade: 8 } });
});

describe("GET /api/v1/backoffice/equipe/bonus", () => {
  it("retorna gestores e consultores com saldos", async () => {
    const response = await GETBonus(bonusRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.gestores).toHaveLength(1);
    expect(body.gestores[0].consultores[0].saldoPontos).toBe(8);
    expect(body.resumo.totalConsultores).toBe(1);
    expect(body.ciclo).toEqual({ id: "ciclo-vigente", nome: "Ciclo 2026", status: "EM_ANDAMENTO" });
  });

  it("usa ciclo informado quando cicloId é enviado", async () => {
    mocks.prisma.cicloPontos.findFirst.mockResolvedValueOnce({
      id: "ciclo-manual",
      nome: "Ciclo Manual",
      status: "RESGATE_ABERTO",
    });
    const response = await GETBonus(bonusRequest("?cicloId=ciclo-manual"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.prisma.cicloPontos.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ciclo-manual", backofficeId, publico: "CONSULTOR_PF" } }),
    );
  });

  it("filtra por gestorId", async () => {
    (mocks.prisma.equipe.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: gestorEquipeId,
        nome: "Gestor A",
        consultorPfs: [
          { id: consultorPfId, nome: "Consultor PF 1", cpf: "12345678900", status: "ATIVO" },
        ],
      },
    ]);
    const response = await GETBonus(bonusRequest(`?gestorId=${gestorEquipeId}`));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.prisma.equipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: gestorEquipeId }),
      }),
    );
  });

  it("aplica filtro de período nas movimentações", async () => {
    await GETBonus(bonusRequest("?inicio=2026-08-01&fim=2026-08-31"));
    expect(mocks.prisma.movimentacaoPontos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          consultorPfId: { in: [consultorPfId] },
        }),
      }),
    );
  });

  it("rejeita parametros de data inválidos", async () => {
    const response = await GETBonus(bonusRequest("?inicio=01/08/2026"));
    expect(response.status).toBe(400);
  });

  it("retorna vazio quando não há gestores com consultores PF", async () => {
    (mocks.prisma.equipe.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const response = await GETBonus(bonusRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.gestores).toHaveLength(0);
    expect(body.resumo.totalPontosDistribuidos).toBe(0);
  });

  it("ignora movimentacoes, procedimentos e resgates com consultorPfId nulo", async () => {
    mocks.prisma.movimentacaoPontos.findMany.mockResolvedValue([
      { consultorPfId: null, tipo: "CREDITO", quantidade: 10 },
      { consultorPfId, tipo: "CREDITO", quantidade: 5 },
    ] as Array<{ consultorPfId: string | null; tipo: string; quantidade: number }>);
    mocks.prisma.procedimentoPF.groupBy.mockResolvedValue([
      { consultorPfId: null, _max: { dataReferencia: new Date("2026-08-01T00:00:00.000Z") } },
      { consultorPfId, _max: { dataReferencia: new Date("2026-08-01T00:00:00.000Z") } },
    ] as Array<{ consultorPfId: string | null; _max: { dataReferencia: Date | null } }>);
    mocks.prisma.solicitacaoResgate.groupBy.mockResolvedValue([
      { consultorPfId: null, _count: { id: 1 } },
      { consultorPfId, _count: { id: 1 } },
    ] as Array<{ consultorPfId: string | null; _count: { id: number } }>);
    const response = await GETBonus(bonusRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.gestores[0].consultores[0].saldoPontos).toBe(5);
    expect(body.gestores[0].consultores[0].ultimaProducao).toBeTruthy();
    expect(body.gestores[0].consultores[0].totalResgates).toBe(1);
  });
});

describe("GET /api/v1/backoffice/equipe/bonus/[consultorPfId]/extrato", () => {
  it("retorna extrato do consultor", async () => {
    const response = await GETExtrato(extratoRequest(consultorPfId), { params: { consultorPfId } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.consultor.id).toBe(consultorPfId);
    expect(body.movimentacoes).toHaveLength(2);
    expect(body.saldoAtual).toBe(8);
  });

  it("aplica filtros de ciclo e período", async () => {
    await GETExtrato(extratoRequest(consultorPfId, "?cicloId=ciclo-vigente&inicio=2026-08-01&fim=2026-08-31"), { params: { consultorPfId } });
    expect(mocks.prisma.movimentacaoPontos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          consultorPfId,
          cicloPontosId: "ciclo-vigente",
        }),
      }),
    );
  });

  it("retorna 404 quando consultor não existe", async () => {
    mocks.prisma.consultorPf.findFirst.mockResolvedValue(null);
    const response = await GETExtrato(extratoRequest("inexistente"), { params: { consultorPfId: "inexistente" } });
    expect(response.status).toBe(404);
  });

  it("retorna 404 quando consultor pertence a outro backoffice", async () => {
    mocks.prisma.consultorPf.findFirst.mockResolvedValue({
      id: consultorPfId,
      lideranca: { backofficeId: "bo-outro" },
    });
    const response = await GETExtrato(extratoRequest(consultorPfId), { params: { consultorPfId } });
    expect(response.status).toBe(404);
  });

  it("rejeita parametros de data inválidos", async () => {
    const response = await GETExtrato(extratoRequest(consultorPfId, "?inicio=01/08/2026"), { params: { consultorPfId } });
    expect(response.status).toBe(400);
  });

  it("mantém saldo zerado quando não há movimentações", async () => {
    mocks.prisma.movimentacaoPontos.findMany.mockResolvedValue([]);
    mocks.prisma.movimentacaoPontos.aggregate.mockResolvedValue({ _sum: { quantidade: 0 } });
    const response = await GETExtrato(extratoRequest(consultorPfId), { params: { consultorPfId } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.saldoAtual).toBe(0);
    expect(body.movimentacoes).toHaveLength(0);
  });
});
