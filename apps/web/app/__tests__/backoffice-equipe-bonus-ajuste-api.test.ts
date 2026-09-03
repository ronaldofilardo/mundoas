import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    consultorPf: {
      findFirst: vi.fn(),
    },
    movimentacaoPontos: {
      create: vi.fn(),
    },
    cicloPontos: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  requireBackofficeWithScope: vi.fn(),
  calcularSaldoBonusConsultorPf: vi.fn(),
  criarAuditLog: vi.fn(),
  obterCicloBonusConsultorPf: vi.fn(),
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

vi.mock("@/lib/pontos-utils", async () => ({
  ...(await vi.importActual<typeof import("@/lib/pontos-utils")>("@/lib/pontos-utils")),
  calcularSaldoBonusConsultorPf: mocks.calcularSaldoBonusConsultorPf,
  obterCicloBonusConsultorPf: mocks.obterCicloBonusConsultorPf,
}));

vi.mock("@/lib/audit", async () => ({
  criarAuditLog: mocks.criarAuditLog,
}));

import { POST as POSTAjuste } from "../api/v1/backoffice/equipe/bonus/[consultorPfId]/ajuste/route";

const backofficeId = "bo-1";
const consultorPfId = "cpf-1";

function ajusteRequest(delta: number) {
  const req = new NextRequest("http://localhost/api/v1/backoffice/equipe/bonus/cpf-1/ajuste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireBackofficeWithScope.mockResolvedValue({ backofficeId, session: { user: { id: "user-1" } }, error: null });
  mocks.obterCicloBonusConsultorPf.mockResolvedValue({ id: "ciclo-1", nome: "Ciclo 2026", status: "EM_ANDAMENTO" });
  mocks.prisma.movimentacaoPontos.create.mockResolvedValue({ id: "mov-1", tipo: "CREDITO", quantidade: 1 });
  mocks.calcularSaldoBonusConsultorPf.mockResolvedValue(10);
  mocks.criarAuditLog.mockResolvedValue(undefined);
  (mocks.prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({ movimentacaoPontos: { create: mocks.prisma.movimentacaoPontos.create } }));
  (mocks.prisma.consultorPf.findFirst as ReturnType<typeof vi.fn>).mockImplementation(async (args: { where: { id: string; lideranca: { backofficeId: string } } }) => {
    if (args.where.lideranca.backofficeId !== backofficeId) return null;
    return { id: args.where.id, nome: "Consultor PF 1", lideranca: { backofficeId } };
  });
});

describe("POST /api/v1/backoffice/equipe/bonus/[consultorPfId]/ajuste", () => {
  it("cria crédito quando delta é positivo", async () => {
    const response = await POSTAjuste(ajusteRequest(1), { params: { consultorPfId } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.saldoAtual).toBe(10);
    expect(mocks.prisma.movimentacaoPontos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "CREDITO",
          origem: "AJUSTE_MANUAL",
          quantidade: 1,
        }),
      }),
    );
    expect(mocks.criarAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "AJUSTE_MANUAL_BONUS_CONSULTOR_PF",
        detalhes: expect.objectContaining({ delta: 1, tipo: "CREDITO" }),
      }),
    );
  });

  it("cria débito quando delta é negativo", async () => {
    const response = await POSTAjuste(ajusteRequest(-1), { params: { consultorPfId } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.prisma.movimentacaoPontos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "DEBITO",
          origem: "AJUSTE_MANUAL",
          quantidade: 1,
        }),
      }),
    );
    expect(mocks.criarAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        detalhes: expect.objectContaining({ delta: -1, tipo: "DEBITO" }),
      }),
    );
  });

  it("rejeita delta igual a zero", async () => {
    const response = await POSTAjuste(ajusteRequest(0), { params: { consultorPfId } });
    expect(response.status).toBe(400);
  });

  it("rejeita consultor inexistente", async () => {
    mocks.prisma.consultorPf.findFirst.mockResolvedValue(null);
    const response = await POSTAjuste(ajusteRequest(1), { params: { consultorPfId } });
    expect(response.status).toBe(404);
  });

  it("rejeita consultor de outro backoffice", async () => {
    mocks.requireBackofficeWithScope.mockResolvedValue({ backofficeId: "bo-outro", session: { user: { id: "user-1" } }, error: null });
    const response = await POSTAjuste(ajusteRequest(1), { params: { consultorPfId } });
    expect(response.status).toBe(404);
  });

  it("rejeita quando não há ciclo ativo", async () => {
    mocks.obterCicloBonusConsultorPf.mockResolvedValue(null);
    const response = await POSTAjuste(ajusteRequest(1), { params: { consultorPfId } });
    expect(response.status).toBe(400);
  });
});
