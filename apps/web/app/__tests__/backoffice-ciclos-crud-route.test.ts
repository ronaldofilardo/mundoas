import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    cicloPontos: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    movimentacaoPontos: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
    },
    solicitacaoResgate: { count: vi.fn() },
    parceiro: { findMany: vi.fn() },
  },
  requireBackofficeWithScope: vi.fn(),
}));

vi.mock("@asa/database", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/api-helpers", async () => {
  const { NextResponse } = await import("next/server");
  return {
    requireBackofficeWithScope: mocks.requireBackofficeWithScope,
    badRequest: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
    forbidden: () => NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    ok: (data: unknown) => NextResponse.json(data, { status: 200 }),
    created: (data: unknown) => NextResponse.json(data, { status: 201 }),
  };
});

import { POST } from "../api/v1/backoffice/pontos/ciclos/route";
import { DELETE, PATCH } from "../api/v1/backoffice/pontos/ciclos/[id]/route";

const baseCycle = {
  id: "ciclo-1",
  backofficeId: "bo-1",
  nome: "Ciclo Junho",
  periodicidade: "SEMESTRAL",
  inicioAcumuloEm: new Date("2026-06-01T00:00:00.000Z"),
  fimAcumuloEm: new Date("2026-06-30T00:00:00.000Z"),
  inicioResgateEm: new Date("2026-07-01T00:00:00.000Z"),
  fimResgateEm: new Date("2026-07-31T00:00:00.000Z"),
  status: "EM_ANDAMENTO",
  processadoExpiracaoEm: null,
};

function request(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/v1/backoffice/pontos/ciclos", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireBackofficeWithScope.mockResolvedValue({ backofficeId: "bo-1", session: {}, error: null });
  mocks.prisma.cicloPontos.findFirst.mockResolvedValue(null);
  mocks.prisma.cicloPontos.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    ...baseCycle,
    ...data,
    id: "ciclo-novo",
  }));
  mocks.prisma.cicloPontos.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...baseCycle, ...data }));
  mocks.prisma.movimentacaoPontos.count.mockResolvedValue(0);
  mocks.prisma.solicitacaoResgate.count.mockResolvedValue(0);
});

describe("rotas CRUD de ciclos", () => {
  it("cria usando datas sem exigir ou persistir Periodicidade do formulário", async () => {
    const response = await POST(request("POST", {
      nome: "Ciclo Junho",
      inicioAcumuloEm: "2026-06-01T00:00:00.000Z",
      fimAcumuloEm: "2026-06-30T00:00:00.000Z",
      fimResgateEm: "2026-07-31T00:00:00.000Z",
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe("ciclo-novo");
    const createArg = mocks.prisma.cicloPontos.create.mock.calls[0][0];
    expect(createArg.data.periodicidade).toBe("SEMESTRAL");
  });

  it("edita o ciclo dentro do backoffice autenticado", async () => {
    mocks.prisma.cicloPontos.findUnique.mockResolvedValue(baseCycle);
    const response = await PATCH(request("PATCH", {
      nome: "Ciclo atualizado",
      inicioAcumuloEm: "2026-06-02T00:00:00.000Z",
      fimAcumuloEm: "2026-06-30T00:00:00.000Z",
      fimResgateEm: "2026-07-31T00:00:00.000Z",
    }), { params: { id: "ciclo-1" } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mensagem).toBe("Ciclo atualizado com sucesso");
    expect(mocks.prisma.cicloPontos.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "ciclo-1" },
      data: expect.objectContaining({ nome: "Ciclo atualizado" }),
    }));
  });

  it("nega edição de ciclo pertencente a outro backoffice", async () => {
    mocks.prisma.cicloPontos.findUnique.mockResolvedValue({ ...baseCycle, backofficeId: "bo-outro" });
    const response = await PATCH(request("PATCH", { nome: "Não permitido" }), { params: { id: "ciclo-1" } });
    expect(response.status).toBe(403);
    expect(mocks.prisma.cicloPontos.update).not.toHaveBeenCalled();
  });

  it("deleta ciclo sem histórico após confirmação da interface", async () => {
    mocks.prisma.cicloPontos.findUnique.mockResolvedValue(baseCycle);
    const response = await DELETE(request("DELETE"), { params: { id: "ciclo-1" } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.mensagem).toBe("Ciclo deletado com sucesso");
    expect(mocks.prisma.cicloPontos.delete).toHaveBeenCalledWith({ where: { id: "ciclo-1" } });
  });

  it("bloqueia exclusão quando há movimentações ou resgates", async () => {
    mocks.prisma.cicloPontos.findUnique.mockResolvedValue(baseCycle);
    mocks.prisma.movimentacaoPontos.count.mockResolvedValue(1);
    const response = await DELETE(request("DELETE"), { params: { id: "ciclo-1" } });
    expect(response.status).toBe(400);
    expect(mocks.prisma.cicloPontos.delete).not.toHaveBeenCalled();
  });
});
