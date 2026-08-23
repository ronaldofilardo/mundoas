import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/backoffice/consultores-pf/comissoes/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { calcularComissaoConsultorPf } from "@/lib/pontos-utils";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    equipe: { findMany: vi.fn() },
    comissaoEquipe: { findMany: vi.fn(), count: vi.fn() },
    consultorPf: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/pontos-utils", () => ({ calcularComissaoConsultorPf: vi.fn() }));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);
const calculoMock = vi.mocked(calcularComissaoConsultorPf);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/backoffice/consultores-pf/comissoes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API backoffice/consultores-pf/comissoes — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem escopo no GET", async () => {
    const response = await GET(new NextRequest("http://localhost"));

    expect(response.status).toBe(401);
  });

  it("lista comissões e consultores com paginação", async () => {
    authenticate();
    prismaMock.equipe.findMany.mockResolvedValue([{ id: "lider-1" }] as Awaited<
      ReturnType<typeof prisma.equipe.findMany>
    >);
    prismaMock.comissaoEquipe.findMany.mockResolvedValue([
      { id: "comissao-1", equipe: { id: "consultor-1", nome: "Consultor", cpf: "52998224725", liderancaId: "lider-1" } },
    ] as Awaited<ReturnType<typeof prisma.comissaoEquipe.findMany>>);
    prismaMock.comissaoEquipe.count.mockResolvedValue(3);
    prismaMock.consultorPf.findMany.mockResolvedValue([
      { id: "consultor-1", nome: "Consultor", cpf: "52998224725" },
    ] as Awaited<ReturnType<typeof prisma.consultorPf.findMany>>);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/backoffice/consultores-pf/comissoes?page=2&limit=1&mesReferencia=2026-08&consultorPfId=consultor-1"),
    );
    const body = (await response.json()) as { pagination: Record<string, number>; consultores: unknown[] };

    expect(response.status).toBe(200);
    expect(body.pagination).toMatchObject({ page: 2, limit: 1, total: 3, totalPages: 3 });
    expect(body.consultores).toHaveLength(1);
    expect(prismaMock.comissaoEquipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1, skip: 1 }),
    );
  });

  it("rejeita cálculo sem campos obrigatórios", async () => {
    authenticate();

    const response = await POST(postRequest({ consultorPfId: "consultor-1" }));

    expect(response.status).toBe(400);
    expect(calculoMock).not.toHaveBeenCalled();
  });

  it("calcula comissão com valor string normalizado", async () => {
    authenticate();
    calculoMock.mockResolvedValue({ percentual: 10, valorComissao: 20 } as Awaited<
      ReturnType<typeof calcularComissaoConsultorPf>
    >);

    const response = await POST(
      postRequest({
        consultorPfId: "consultor-1",
        valorProcedimento: "200",
        dataReferencia: "2026-08-22",
        tipoProcedimento: "CONSULTA",
      }),
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ valorProcedimento: 200, dataReferencia: "2026-08-22" });
    expect(calculoMock).toHaveBeenCalledWith(
      expect.objectContaining({ consultorPfId: "consultor-1", valorProcedimento: 200 }),
    );
  });

  it("converte falha de cálculo em 400", async () => {
    authenticate();
    calculoMock.mockRejectedValue(new Error("Regra não encontrada"));

    const response = await POST(
      postRequest({ consultorPfId: "consultor-1", valorProcedimento: 100, dataReferencia: "2026-08-22" }),
    );

    expect(response.status).toBe(400);
  });
});
