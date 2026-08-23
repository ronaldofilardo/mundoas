import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getComercial, PATCH as patchComercial } from "@/app/api/v1/backoffice/comerciais/[id]/route";
import { POST as calcularComissao } from "@/app/api/v1/backoffice/comerciais/calcular-comissao/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { calcularComissaoComercial } from "@/lib/pontos-utils";
import { prisma } from "@asa/database";
import * as equipeIdRoute from "@/app/api/v1/backoffice/equipe/[id]/route";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: { equipe: { findFirst: vi.fn() } },
}));

vi.mock("@/lib/pontos-utils", () => ({ calcularComissaoComercial: vi.fn() }));
vi.mock("@/app/api/v1/backoffice/equipe/[id]/route", () => ({ PATCH: vi.fn(), DELETE: vi.fn() }));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);
const calculoMock = vi.mocked(calcularComissaoComercial);
const equipePatchMock = vi.mocked(equipeIdRoute.PATCH);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

function bodyRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/backoffice/comerciais/calcular-comissao", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("APIs backoffice/comerciais — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("rejeita cálculo sem escopo", async () => {
    const response = await calcularComissao(bodyRequest({ comercialId: "c-1" }));

    expect(response.status).toBe(401);
  });

  it("valida campos obrigatórios do cálculo", async () => {
    authenticate();

    const response = await calcularComissao(bodyRequest({ comercialId: "c-1" }));

    expect(response.status).toBe(400);
    expect(calculoMock).not.toHaveBeenCalled();
  });

  it("retorna o cálculo com os dados normalizados", async () => {
    authenticate();
    calculoMock.mockResolvedValue({ percentual: 10, valorComissao: 25 } as Awaited<
      ReturnType<typeof calcularComissaoComercial>
    >);

    const response = await calcularComissao(
      bodyRequest({
        comercialId: "c-1",
        valorProcedimento: "250",
        dataReferencia: "2026-08-22",
        tipoProcedimento: "CONSULTA",
      }),
    );
    const result = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ valorProcedimento: 250, dataReferencia: "2026-08-22" });
    expect(calculoMock).toHaveBeenCalledWith(
      expect.objectContaining({ comercialId: "c-1", valorProcedimento: 250 }),
    );
  });

  it("converte erro do cálculo em 400", async () => {
    authenticate();
    calculoMock.mockRejectedValue(new Error("Comercial não encontrado"));

    const response = await calcularComissao(
      bodyRequest({ comercialId: "c-1", valorProcedimento: 100, dataReferencia: "2026-08-22" }),
    );

    expect(response.status).toBe(400);
  });

  it("retorna 401 no GET do comercial sem escopo", async () => {
    const response = await getComercial(
      new NextRequest("http://localhost/api/v1/backoffice/comerciais/c-1"),
      { params: { id: "c-1" } },
    );

    expect(response.status).toBe(401);
  });

  it("nega GET de comercial pertencente a outro backoffice", async () => {
    authenticate();
    prismaMock.equipe.findFirst.mockResolvedValue({
      id: "c-1",
      tipo: "COMERCIAL",
      backofficeId: "outro-backoffice",
      liderancaId: null,
      lideranca: null,
    } as Awaited<ReturnType<typeof prisma.equipe.findFirst>>);

    const response = await getComercial(
      new NextRequest("http://localhost/api/v1/backoffice/comerciais/c-1"),
      { params: { id: "c-1" } },
    );

    expect(response.status).toBe(403);
  });

  it("adapta PATCH legado para a rota unificada", async () => {
    equipePatchMock.mockResolvedValue(Response.json({ id: "c-1" }));

    const response = await patchComercial(
      new NextRequest("http://localhost/api/v1/backoffice/comerciais/c-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome: "Novo nome", lideranca: "GESTOR" }),
      }),
      { params: { id: "c-1" } },
    );

    expect(response.status).toBe(200);
    const adaptedRequest = equipePatchMock.mock.calls[0]?.[0];
    expect(await adaptedRequest?.json()).toMatchObject({
      nome: "Novo nome",
      tipoLideranca: "GESTOR",
    });
  });
});
