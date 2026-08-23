import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/lideranca/consultores-pf/producao/route";
import { requireLiderancaWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireLiderancaWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultorPf: { findMany: vi.fn() },
    procedimentoPF: { findMany: vi.fn() },
    metaConsultorPf: { findMany: vi.fn() },
  },
}));

const scopeMock = vi.mocked(requireLiderancaWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "lider-user", tipo: "LIDERANCA" } },
    liderancaId: "lider-1",
    error: null,
  } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
}

function request(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/v1/lideranca/consultores-pf/producao?${query}`);
}

describe("API lideranca/consultores-pf/producao — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      liderancaId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
  });

  it("retorna 401 sem escopo de liderança", async () => {
    const response = await GET(request("inicio=2026-08&fim=2026-09"));

    expect(response.status).toBe(401);
  });

  it("rejeita competência inválida ou intervalo invertido", async () => {
    authenticate();

    const response = await GET(request("inicio=2026-13&fim=2026-09"));

    expect(response.status).toBe(400);
    expect(prismaMock.consultorPf.findMany).not.toHaveBeenCalled();
  });

  it("retorna estrutura vazia quando não há consultores ativos", async () => {
    authenticate();
    prismaMock.consultorPf.findMany.mockResolvedValue([]);

    const response = await GET(request("inicio=2026-08&fim=2026-09"));
    const body = (await response.json()) as { registros: unknown[]; resumo: Record<string, number> };

    expect(response.status).toBe(200);
    expect(body.registros).toEqual([]);
    expect(body.resumo).toMatchObject({ totalProducao: 0, totalComissao: 0, totalMeta: 0, quantidade: 0 });
    expect(prismaMock.procedimentoPF.findMany).not.toHaveBeenCalled();
  });

  it("agrega produção, comissão, meta e atingimento por competência", async () => {
    authenticate();
    prismaMock.consultorPf.findMany.mockResolvedValue([
      { id: "consultor-1", nome: "Consultor", cpf: "52998224725" },
    ] as Awaited<ReturnType<typeof prisma.consultorPf.findMany>>);
    prismaMock.procedimentoPF.findMany.mockResolvedValue([
      {
        id: "proc-1",
        consultorPfId: "consultor-1",
        dataReferencia: new Date("2026-08-15T00:00:00.000Z"),
        dataPagamento: null,
        formaPagamento: "PIX",
        paciente: "Paciente",
        procedimento: "Consulta",
        cpf: "11111111111",
        tipoProcedimento: "CONSULTA",
        unidade: "Unidade",
        valorTotal: 100,
        valorComissao: 10,
        consultorPf: { id: "consultor-1", nome: "Consultor" },
        parceiro: null,
        indicado: null,
        upload: null,
      },
    ] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>);
    prismaMock.metaConsultorPf.findMany.mockResolvedValue([
      { consultorPfId: "consultor-1", mesReferencia: "2026-08", valorMeta: 200, setorId: "setor-1" },
    ] as Awaited<ReturnType<typeof prisma.metaConsultorPf.findMany>>);

    const response = await GET(request("inicio=2026-08&fim=2026-09"));
    const body = (await response.json()) as {
      registros: Array<Record<string, unknown>>;
      resumo: Record<string, number> & { porMes: Array<Record<string, number>> };
    };

    expect(response.status).toBe(200);
    expect(body.registros[0]).toMatchObject({ mesReferencia: "2026-08", valorProducao: 100, valorComissao: 10 });
    expect(body.resumo).toMatchObject({ totalProducao: 100, totalComissao: 10, totalMeta: 200, quantidade: 1 });
    expect(body.resumo.totalAtingido).toBe(50);
    expect(body.resumo.porMes[0]).toMatchObject({ mes: "2026-08", totalProducao: 100, totalMeta: 200 });
  });
});
