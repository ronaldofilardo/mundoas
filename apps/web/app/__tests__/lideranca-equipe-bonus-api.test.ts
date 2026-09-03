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
    movimentacaoPontos: {
      findMany: vi.fn(),
    },
    procedimentoPF: {
      groupBy: vi.fn(),
    },
    solicitacaoResgate: {
      groupBy: vi.fn(),
    },
  },
  requireLiderancaWithScope: vi.fn(),
}));

vi.mock("@asa/database", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/api-helpers", async () => {
  const { NextResponse } = await import("next/server");
  return {
    requireLiderancaWithScope: mocks.requireLiderancaWithScope,
    badRequest: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
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

import { GET as GETBonus } from "../api/v1/lideranca/equipe/bonus/route";
import { obterCicloBonusConsultorPf } from "@/lib/pontos-utils";

const backofficeId = "bo-lider-1";
const gestorEquipeId = "gestor-lider-1";
const consultorPfId = "cpf-lider-1";

function bonusRequest(query?: string) {
  return new NextRequest(`http://localhost/api/v1/lideranca/equipe/bonus${query ?? ""}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireLiderancaWithScope.mockResolvedValue({
    session: { user: { id: "lider-user", tipo: "LIDERANCA" } },
    liderancaId: "lider-1",
    backofficeId,
    lideranca: { id: "lider-1", backofficeId, tipo: "LIDERANCA", tipoLideranca: "COMERCIAL" },
    error: null,
  } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
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
    { consultorPfId, tipo: "CREDITO", quantidade: 10, criadoEm: new Date("2026-08-01T00:00:00.000Z") },
    { consultorPfId, tipo: "DEBITO", quantidade: 2, criadoEm: new Date("2026-08-02T00:00:00.000Z") },
  ]);
  mocks.prisma.procedimentoPF.groupBy.mockResolvedValue([
    { consultorPfId, _max: { dataReferencia: new Date("2026-08-01T00:00:00.000Z") } },
  ]);
  mocks.prisma.solicitacaoResgate.groupBy.mockResolvedValue([
    { consultorPfId, _count: { id: 1 } },
  ]);
  (mocks.prisma.cicloPontos.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "ciclo-vigente",
    nome: "Ciclo 2026",
    status: "EM_ANDAMENTO",
  });
});

describe("GET /api/v1/lideranca/equipe/bonus", () => {
  it("retorna 401 quando usuário não está autenticado", async () => {
    mocks.requireLiderancaWithScope.mockResolvedValue({
      session: null,
      liderancaId: null,
      backofficeId: null,
      lideranca: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);

    const response = await GETBonus(bonusRequest());
    expect(response.status).toBe(401);
  });

  it("retorna 403 quando usuário não é LIDERANCA", async () => {
    mocks.requireLiderancaWithScope.mockResolvedValue({
      session: null,
      liderancaId: null,
      backofficeId: null,
      lideranca: null,
      error: Response.json({ error: "Acesso negado" }, { status: 403 }),
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);

    const response = await GETBonus(bonusRequest());
    expect(response.status).toBe(403);
  });

  it("retorna gestores e consultores com saldos", async () => {
    const response = await GETBonus(bonusRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.gestores).toHaveLength(1);
    expect(body.gestores[0].consultores[0].saldoPontos).toBe(8);
    expect(body.resumo.totalConsultores).toBe(1);
    expect(body.resumo.totalGestores).toBe(1);
    expect(body.resumo.totalPontosDistribuidos).toBe(8);
  });

  it("usa ciclo informado quando cicloId é enviado", async () => {
    (mocks.prisma.cicloPontos.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
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
    expect(body.ciclo.id).toBe("ciclo-manual");
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
