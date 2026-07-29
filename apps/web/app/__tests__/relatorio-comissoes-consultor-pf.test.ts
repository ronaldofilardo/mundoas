/**
 * Testes - Relatório de Comissões (tipo=consultor-pf)
 *
 * Valida a nova agregação de produção via $queryRaw com GROUP BY e o flag
 * `divergente` quando o valor gravado em comissoes_consultores_pf
 * diverge do SUM(valor_comissao) de procedimentos_pf.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { NextRequest } from "next/server";
import { uniqueCpf } from "./test-helpers";
import * as handlers from "../api/v1/backoffice/relatorio-comissoes/route";

vi.mock("@/lib/api-helpers", async () => {
  const actual = await vi.importActual("@/lib/api-helpers");
  return {
    ...actual,
    requireBackofficeWithScope: vi.fn(),
  };
});

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  auth: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

import { requireBackofficeWithScope } from "@/lib/api-helpers";
const mockAuth = vi.mocked(requireBackofficeWithScope);

function makeSession(backofficeId: string) {
  return {
    session: {
      user: {
        id: "user-test",
        email: "back@asa.test",
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
        consultorId: null,
        estabelecimentoId: null,
        backofficeId,
        parceiroId: null,
        comercialId: null,
      },
      expires: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    backofficeId,
    liderancaId: null,
    backoffice: { id: backofficeId },
    error: null,
  };
}

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/v1/backoffice/relatorio-comissoes");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return { url: url.toString(), searchParams: url.searchParams } as unknown as NextRequest;
}

describe("GET /api/v1/backoffice/relatorio-comissoes - consultor-pf", () => {
  let backofficeId: string;
  let liderancaId: string;
  let consultorPfId: string;
  let uploadId: string;
  let cleanupIds: {
    comissoes: string[];
    procedimentos: string[];
    consultorPf: string[];
    usuarios: string[];
    backoffices: string[];
    liderancas: string[];
    uploads: string[];
  };

  beforeEach(async () => {
    cleanupIds = {
      comissoes: [],
      procedimentos: [],
      consultorPf: [],
      usuarios: [],
      backoffices: [],
      liderancas: [],
      uploads: [],
    };
    mockAuth.mockReset();

    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Rel Test",
        email: `backoffice-rel-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
      },
    });
    cleanupIds.usuarios.push(backofficeUsuario.id);

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: "Backoffice Rel Test",
        cpf: uniqueCpf(),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;
    cleanupIds.backoffices.push(backoffice.id);

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Rel Test",
        email: `lideranca-rel-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
      },
    });
    cleanupIds.usuarios.push(liderancaUsuario.id);

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Rel Test",
        cpf: uniqueCpf(),
        backofficeId,
        tipo: "COMERCIAL",
      },
    });
    liderancaId = lideranca.id;
    cleanupIds.liderancas.push(lideranca.id);

    const consultorUsuario = await prisma.usuario.create({
      data: {
        nome: "Consultor Rel Test",
        email: `consultor-rel-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "CONSULTOR",
      },
    });
    cleanupIds.usuarios.push(consultorUsuario.id);

    const consultor = await prisma.consultorPf.create({
      data: {
        usuarioId: consultorUsuario.id,
        nome: "Dr. Rel Test",
        cpf: uniqueCpf(),
        liderancaId,
      },
    });
    consultorPfId = consultor.id;
    cleanupIds.consultorPf.push(consultor.id);

    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId,
        nomeArquivo: "rel-test.xlsx",
        mesReferencia: "2026-07",
      },
    });
    uploadId = upload.id;
    cleanupIds.uploads.push(upload.id);
  });

  afterEach(async () => {
    for (const id of cleanupIds.comissoes) {
      await prisma.comissaoConsultorPf.delete({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupIds.procedimentos) {
      await prisma.procedimentoPF.delete({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupIds.uploads) {
      await prisma.uploadPlanilhaBackoffice.delete({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupIds.consultorPf) {
      await prisma.consultorPf.delete({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupIds.liderancas) {
      await prisma.lideranca.delete({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupIds.backoffices) {
      await prisma.backoffice.delete({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupIds.usuarios) {
      await prisma.usuario.delete({ where: { id } }).catch(() => {});
    }
  });

  async function criarProcedimento(opts: {
    dataReferencia: Date;
    valorComissao: number;
    procedimento: string;
  }) {
    const proc = await prisma.procedimentoPF.create({
      data: {
        dataReferencia: opts.dataReferencia,
        dataPagamento: opts.dataReferencia,
        formaPagamento: "CARTAO",
        totalPago: opts.valorComissao * 5,
        paciente: "Paciente Rel Test",
        procedimento: opts.procedimento,
        cpf: uniqueCpf(),
        tipoProcedimento: "CONSULTA",
        unidade: "UNIDADE_REL",
        uploadId,
        consultorPfId,
        valorComissao: opts.valorComissao,
      },
    });
    cleanupIds.procedimentos.push(proc.id);
    return proc;
  }

  async function criarComissao(opts: { mesReferencia: string; valorProducao: number; valorComissao: number }) {
    const c = await prisma.comissaoConsultorPf.create({
      data: {
        consultorPfId,
        mesReferencia: opts.mesReferencia,
        valorProducao: opts.valorProducao,
        valorComissao: opts.valorComissao,
      },
    });
    cleanupIds.comissoes.push(c.id);
    return c;
  }

  it("deve retornar com divergente=false quando SUM(ProcedimentoPF) === valorProducao gravado", async () => {
    await criarProcedimento({ dataReferencia: new Date("2026-07-05"), valorComissao: 100, procedimento: "P1" });
    await criarProcedimento({ dataReferencia: new Date("2026-07-15"), valorComissao: 200, procedimento: "P2" });
    await criarProcedimento({ dataReferencia: new Date("2026-07-25"), valorComissao: 300, procedimento: "P3" });
    await criarComissao({ mesReferencia: "2026-07", valorProducao: 600, valorComissao: 60 });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(
      makeRequest({ inicio: "2026-07", fim: "2026-07", tipo: "consultor-pf" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.tipo).toBe("consultor-pf");
    expect(data.comissoes).toHaveLength(1);
    expect(data.comissoes[0].valorProducao).toBe(600);
    expect(data.comissoes[0].valorProducaoCalculado).toBe(600);
    expect(data.comissoes[0].divergente).toBe(false);

    expect(data.resumo.totalGeral.totalProducao).toBe(600);
    expect(data.resumo.totalGeral.totalProducaoCalculada).toBe(600);
    expect(data.resumo.totalGeral.totalDivergencias).toBe(0);
  });

  it("deve retornar com divergente=true quando valorProducao != SUM(ProcedimentoPF)", async () => {
    await criarProcedimento({ dataReferencia: new Date("2026-08-10"), valorComissao: 100, procedimento: "P1" });
    await criarProcedimento({ dataReferencia: new Date("2026-08-20"), valorComissao: 250, procedimento: "P2" });
    await criarComissao({ mesReferencia: "2026-08", valorProducao: 999, valorComissao: 60 });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(
      makeRequest({ inicio: "2026-08", fim: "2026-08", tipo: "consultor-pf" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.comissoes).toHaveLength(1);
    expect(data.comissoes[0].valorProducao).toBe(999);
    expect(data.comissoes[0].valorProducaoCalculado).toBe(350);
    expect(data.comissoes[0].divergente).toBe(true);
    expect(data.resumo.totalGeral.totalDivergencias).toBe(1);
  });

  it("deve respeitar o filtro por mesReferencia (não soma meses fora do intervalo)", async () => {
    await criarProcedimento({ dataReferencia: new Date("2026-09-10"), valorComissao: 100, procedimento: "P1" });
    await criarProcedimento({ dataReferencia: new Date("2026-10-10"), valorComissao: 999, procedimento: "P2-FORA" });
    await criarComissao({ mesReferencia: "2026-09", valorProducao: 100, valorComissao: 10 });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(
      makeRequest({ inicio: "2026-09", fim: "2026-09", tipo: "consultor-pf" })
    );
    const data = await res.json();

    expect(data.comissoes).toHaveLength(1);
    expect(data.comissoes[0].valorProducaoCalculado).toBe(100);
    expect(data.comissoes[0].divergente).toBe(false);
  });

  it("deve agregar múltiplos procedimentos do mesmo mês no $queryRaw", async () => {
    for (let i = 1; i <= 5; i++) {
      await criarProcedimento({
        dataReferencia: new Date(2026, 6, i + 1),
        valorComissao: 50,
        procedimento: `CONS-${i}`,
      });
    }
    await criarComissao({ mesReferencia: "2026-07", valorProducao: 250, valorComissao: 25 });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(
      makeRequest({ inicio: "2026-07", fim: "2026-07", tipo: "consultor-pf" })
    );
    const data = await res.json();

    expect(data.comissoes[0].valorProducaoCalculado).toBe(250);
    expect(data.comissoes[0].divergente).toBe(false);
  });

  it("deve ignorar dias 29-31 quando o filtro cruza meses curtos", async () => {
    await criarProcedimento({ dataReferencia: new Date("2026-02-28"), valorComissao: 50, procedimento: "P-FEV" });
    await criarProcedimento({ dataReferencia: new Date("2026-03-01"), valorComissao: 100, procedimento: "P-MAR" });
    await criarComissao({ mesReferencia: "2026-02", valorProducao: 50, valorComissao: 5 });
    await criarComissao({ mesReferencia: "2026-03", valorProducao: 100, valorComissao: 10 });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(
      makeRequest({ inicio: "2026-02", fim: "2026-03", tipo: "consultor-pf" })
    );
    const data = await res.json();

    const fev = data.comissoes.find((c: any) => c.mesReferencia === "2026-02");
    const mar = data.comissoes.find((c: any) => c.mesReferencia === "2026-03");
    expect(fev.valorProducaoCalculado).toBe(50);
    expect(mar.valorProducaoCalculado).toBe(100);
    expect(fev.divergente).toBe(false);
    expect(mar.divergente).toBe(false);
  });

  it("deve retornar 400 sem inicio/fim", async () => {
    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(makeRequest({ tipo: "consultor-pf" }));
    expect(res.status).toBe(400);
  });

  it("deve retornar lista vazia quando backoffice não tem consultores PF", async () => {
    await prisma.consultorPf.delete({ where: { id: consultorPfId } });
    cleanupIds.consultorPf.length = 0;

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(
      makeRequest({ inicio: "2026-07", fim: "2026-07", tipo: "consultor-pf" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comissoes).toEqual([]);
    expect(data.consultores).toEqual([]);
  });
});
