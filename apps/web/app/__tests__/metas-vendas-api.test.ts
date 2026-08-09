import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { NextRequest } from "next/server";
import { uniqueCpf } from "./test-helpers";
import * as handlers from "../api/v1/backoffice/metas-vendas/route";

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
  const url = new URL("http://localhost/api/v1/backoffice/metas-vendas");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return { url: url.toString(), searchParams: url.searchParams } as unknown as NextRequest;
}

describe("GET /api/v1/backoffice/metas-vendas", () => {
  let backofficeId: string;
  let liderancaId: string;
  let consultorPfId: string;
  let setorId: string;
  let createdUsuarioIds: string[] = [];
  let createdConsultorIds: string[] = [];

  beforeEach(async () => {
    createdUsuarioIds = [];

    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Metas",
        email: `backoffice-metas-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
      },
    });
    createdUsuarioIds.push(backofficeUsuario.id);

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: "Backoffice Metas Test",
        cpf: uniqueCpf(),
      },
    });
    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Metas",
        email: `lideranca-metas-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
      },
    });
    createdUsuarioIds.push(liderancaUsuario.id);

    const lideranca = await prisma.equipe.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Metas Test",
        cpf: uniqueCpf(),
        backofficeId,
        tipo: "LIDERANCA",
        tipoLideranca: "COMERCIAL",
      },
    });
    liderancaId = lideranca.id;

    const consultorUsuario = await prisma.usuario.create({
      data: {
        nome: "Consultor Metas Test",
        email: `consultor-metas-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "CONSULTOR_PF",
      },
    });
    createdUsuarioIds.push(consultorUsuario.id);

    const consultor = await prisma.consultorPf.create({
      data: {
        usuarioId: consultorUsuario.id,
        nome: "Dr. Metas Test",
        cpf: uniqueCpf(),
        liderancaId,
        status: "ATIVO",
      },
    });
    consultorPfId = consultor.id;
    createdConsultorIds.push(consultor.id);

    setorId = await prisma.setor.create({
      data: {
        nome: "BSF Test",
      },
    }).then(s => s.id);

    await prisma.consultorPfSetor.create({
      data: {
        consultorPfId,
        setorId,
      },
    });

    mockAuth.mockReset();
  });

  afterEach(async () => {
    for (const id of createdConsultorIds) {
      await prisma.consultorPf.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdUsuarioIds) {
      await prisma.usuario.update({ where: { id }, data: { status: "INATIVO" } }).catch(() => {});
    }
    await prisma.setor.delete({ where: { id: setorId } }).catch(() => {});
  });

  async function criarProcedimento(opts: {
    dataReferencia: Date;
    totalPago: number;
    uploadId?: string;
  }) {
    let uploadId = opts.uploadId;
    if (!uploadId) {
      const up = await prisma.uploadPlanilhaBackoffice.create({
        data: {
          backofficeId,
          nomeArquivo: "metas-test.xlsx",
          mesReferencia: `${opts.dataReferencia.getUTCFullYear()}-${String(opts.dataReferencia.getUTCMonth() + 1).padStart(2, "0")}`,
        },
      });
      uploadId = up.id;
    }
    const proc = await prisma.procedimentoPF.create({
      data: {
        dataReferencia: opts.dataReferencia,
        dataPagamento: opts.dataReferencia,
        totalPago: opts.totalPago,
        consultorPfId,
        tipoProcedimento: "CONSULTA",
        unidade: "UNIDADE",
        cpf: uniqueCpf(),
        paciente: "Paciente Test",
        procedimento: "TEST",
        formaPagamento: "CARTAO",
        uploadId,
      },
    });
    return proc;
  }

  it("deve retornar 401 quando usuário não está autenticado", async () => {
    mockAuth.mockResolvedValue({ error: { status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) } } as any);
    const res = await handlers.GET(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("deve retornar dados agregados por setor com consultor e metas", async () => {
    await prisma.metaConsultorPf.create({
      data: {
        consultorPfId,
        mesReferencia: "2026-01",
        valorMeta: 10000,
        valorAtingido: 0,
      },
    });
    await prisma.metaConsultorPf.create({
      data: {
        consultorPfId,
        mesReferencia: "2026-02",
        valorMeta: 10000,
        valorAtingido: 0,
      },
    });

    await criarProcedimento({
      dataReferencia: new Date("2026-01-15"),
      totalPago: 3000,
    });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(makeRequest({ ano: "2026" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ano).toBe(2026);
    expect(data.setores).toHaveLength(1);
    expect(data.setores[0].setorId).toBe(setorId);
    expect(data.setores[0].consultores).toHaveLength(1);

    const consultor = data.setores[0].consultores[0];
    expect(consultor.nome).toBe("Dr. Metas Test");
    expect(consultor.metaAnual).toBe(20000);
    expect(consultor.realizadoAnual).toBe(3000);
    expect(consultor.atingimento).toBe(15);
  });

  it("deve filtrar por mês quando especificado", async () => {
    await prisma.metaConsultorPf.create({
      data: {
        consultorPfId,
        mesReferencia: "2026-06",
        valorMeta: 5000,
        valorAtingido: 0,
      },
    });

    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId,
        nomeArquivo: "metas-test.xlsx",
        mesReferencia: "2026-06",
      },
    });

    await criarProcedimento({
      dataReferencia: new Date("2026-06-10"),
      totalPago: 2000,
      uploadId: upload.id,
    });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(makeRequest({ ano: "2026", mes: "6" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.mes).toBe(6);
    expect(data.setores[0].consultores[0].realizadoAnual).toBe(2000);
  });

  it("deve retornar 400 para ano inválido", async () => {
    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(makeRequest({ ano: "abc" }));
    expect(res.status).toBe(400);
  });

  it("deve retornar 400 para mês inválido", async () => {
    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(makeRequest({ ano: "2026", mes: "13" }));
    expect(res.status).toBe(400);
  });

  it("deve calcular meses batidos corretamente (>100% de atingimento)", async () => {
    await prisma.metaConsultorPf.create({
      data: {
        consultorPfId,
        mesReferencia: "2026-01",
        valorMeta: 1000,
        valorAtingido: 0,
      },
    });
    await prisma.metaConsultorPf.create({
      data: {
        consultorPfId,
        mesReferencia: "2026-02",
        valorMeta: 1000,
        valorAtingido: 0,
      },
    });

    await criarProcedimento({
      dataReferencia: new Date("2026-01-10"),
      totalPago: 1200,
    });
    await criarProcedimento({
      dataReferencia: new Date("2026-02-10"),
      totalPago: 800,
    });

    mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
    const res = await handlers.GET(makeRequest({ ano: "2026" }));
    const data = await res.json();

    expect(data.setores[0].consultores[0].metaAnual).toBe(2000);
    expect(data.setores[0].consultores[0].realizadoAnual).toBe(2000);
    expect(data.setores[0].consultores[0].atingimento).toBe(100);
    expect(data.setores[0].consultores[0].mesesBatidos).toBe(1);
  });
});