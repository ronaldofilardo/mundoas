import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/backoffice/reprocessar-comissoes/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { calcularComissaoComercial } from "@/lib/pontos-utils";
import { criarAuditLog } from "@/lib/audit";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  ok: (data: unknown) => Response.json(data),
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/pontos-utils", () => ({ calcularComissaoComercial: vi.fn() }));
vi.mock("@/lib/audit", () => ({ criarAuditLog: vi.fn() }));
vi.mock("@asa/database", () => ({
  prisma: {
    procedimentoPF: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    equipe: { findUnique: vi.fn(), findMany: vi.fn() },
    comissaoEquipe: { upsert: vi.fn() },
    metaEquipe: { upsert: vi.fn() },
  },
}));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const rateLimitMock = vi.mocked(rateLimit);
const calcMock = vi.mocked(calcularComissaoComercial);
const prismaMock = vi.mocked(prisma);
const auditMock = vi.mocked(criarAuditLog);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/backoffice/reprocessar-comissoes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API backoffice/reprocessar-comissoes — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockResolvedValue(null);
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 no POST sem escopo", async () => {
    const response = await POST(postRequest({ comercialId: "c-1", mesReferencia: "2026-08" }));

    expect(response.status).toBe(401);
  });

  it("rejeita competência inválida e comercial fora do escopo", async () => {
    authenticate();
    const invalidMonth = await POST(postRequest({ comercialId: "c-1", mesReferencia: "2026-13" }));
    expect(invalidMonth.status).toBe(400);

    prismaMock.equipe.findUnique.mockResolvedValue({
      tipo: "COMERCIAL",
      nome: "Comercial",
      lideranca: { backofficeId: "outro-backoffice" },
    } as Awaited<ReturnType<typeof prisma.equipe.findUnique>>);
    const outsideScope = await POST(postRequest({ comercialId: "c-1", mesReferencia: "2026-08" }));

    expect(outsideScope.status).toBe(400);
  });

  it("retorna informações do GET sem comercial no mês", async () => {
    authenticate();
    prismaMock.procedimentoPF.count.mockResolvedValue(2);
    prismaMock.procedimentoPF.aggregate.mockResolvedValue({ _sum: { valorTotal: 300 } } as Awaited<ReturnType<typeof prisma.procedimentoPF.aggregate>>);
    prismaMock.equipe.findMany.mockResolvedValue([
      { subordinados: [{ id: "c-1", nome: "Comercial", cpf: "52998224725", funcao: "COMERCIAL" }] },
    ] as Awaited<ReturnType<typeof prisma.equipe.findMany>>);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/reprocessar-comissoes?mes=2026-08"));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ mesReferencia: "2026-08", procedimentosSemComercial: 2, totalVendasSemComissional: 300 });
    expect(body.comerciaisDisponiveis).toEqual([
      { id: "c-1", nome: "Comercial", cpf: "52998224725", funcao: "COMERCIAL" },
    ]);
  });

  it("retorna mensagem quando não há procedimentos para processar", async () => {
    authenticate();
    prismaMock.equipe.findUnique.mockResolvedValue({
      tipo: "COMERCIAL",
      nome: "Comercial",
      lideranca: { backofficeId: "backoffice-1" },
    } as Awaited<ReturnType<typeof prisma.equipe.findUnique>>);
    prismaMock.procedimentoPF.findMany.mockResolvedValue([]);

    const response = await POST(postRequest({ comercialId: "c-1", mesReferencia: "2026-08" }));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ procedimentosVinculados: 0, totalVendas: 0, valorComissao: 0 });
    expect(calcMock).not.toHaveBeenCalled();
  });

  it("reprocessa procedimentos e registra auditoria", async () => {
    authenticate();
    prismaMock.equipe.findUnique.mockResolvedValue({
      id: "c-1",
      tipo: "COMERCIAL",
      nome: "Comercial",
      lideranca: { backofficeId: "backoffice-1" },
    } as Awaited<ReturnType<typeof prisma.equipe.findUnique>>);
    prismaMock.procedimentoPF.findMany.mockResolvedValue([
      { id: "proc-1", valorTotal: 100, valorComissao: 0, dataReferencia: new Date("2026-08-10") },
      { id: "proc-2", valorTotal: 200, valorComissao: 0, dataReferencia: new Date("2026-08-11") },
    ] as Awaited<ReturnType<typeof prisma.procedimentoPF.findMany>>);
    calcMock.mockResolvedValue({ valorComissao: 30 } as Awaited<ReturnType<typeof calcularComissaoComercial>>);

    const response = await POST(postRequest({ comercialId: "c-1", mesReferencia: "2026-08" }));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ procedimentosVinculados: 2, totalVendas: 300, valorComissao: 30 });
    expect(prismaMock.procedimentoPF.updateMany).toHaveBeenCalled();
    expect(prismaMock.comissaoEquipe.upsert).toHaveBeenCalled();
    expect(prismaMock.metaEquipe.upsert).toHaveBeenCalled();
    expect(auditMock).toHaveBeenCalled();
  });
});
