/**
 * Testes para o GET /api/v1/backoffice/equipe — validação de que o campo
 * `tipo` é retornado para comerciais e lideranças.
 *
 * Cobrige a correção que adicionou `tipo: c.tipo` no mapping de comerciais.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/backoffice/equipe/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
  ok: (data: unknown) => Response.json(data),
  created: (data: unknown) => Response.json(data, { status: 201 }),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    equipe: { findMany: vi.fn(), findUnique: vi.fn() },
    usuario: { findUnique: vi.fn() },
    backoffice: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

function makeMembro(overrides: Record<string, unknown>) {
  return {
    tipo: "COMERCIAL",
    tipoLideranca: null,
    cpf: "12345678901",
    funcao: null,
    percentualComissao: 0,
    status: "ATIVO",
    liderancaId: null,
    createdAt: new Date(),
    usuario: { id: "u-1", email: "test@test.com", status: "ATIVO" },
    lideranca: null,
    consultorPfs: [],
    subordinados: [],
    ...overrides,
  } as Awaited<ReturnType<typeof prisma.equipe.findMany>>[number];
}

describe("GET /equipe — campo tipo nos comerciais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna campo tipo para comerciais", async () => {
    authenticate();
    prismaMock.equipe.findMany.mockResolvedValue([
      makeMembro({
        id: "com-1",
        nome: "Comercial Teste",
        tipo: "COMERCIAL",
        tipoLideranca: "GESTOR",
        funcao: "GERENTE_CIRE",
        usuario: { id: "u-2", email: "com@teste.com", status: "ATIVO" },
      }),
    ]);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/equipe"));
    const body = (await response.json()) as { liderancas: unknown[]; comerciais: Array<{ id: string; tipo: string; tipoLideranca: string | null; funcao: string | null }> };

    expect(response.status).toBe(200);
    expect(body.comerciais).toHaveLength(1);
    expect(body.comerciais[0].tipo).toBe("COMERCIAL");
    expect(body.comerciais[0].tipoLideranca).toBe("GESTOR");
    expect(body.comerciais[0].funcao).toBe("GERENTE_CIRE");
  });

  it("retorna campo tipo para lideranças", async () => {
    authenticate();
    prismaMock.equipe.findMany.mockResolvedValue([
      makeMembro({
        id: "lid-1",
        nome: "Lider Teste",
        tipo: "LIDERANCA",
        tipoLideranca: "COMERCIAL",
        funcao: "LIDER_COMERCIAL",
        usuario: { id: "u-3", email: "lid@teste.com", status: "ATIVO" },
      }),
    ]);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/equipe"));
    const body = (await response.json()) as { liderancas: Array<{ id: string; tipo: string; tipoLideranca: string | null; funcao: string | null }>; comerciais: unknown[] };

    expect(response.status).toBe(200);
    expect(body.liderancas).toHaveLength(1);
    expect(body.liderancas[0].tipo).toBe("LIDERANCA");
    expect(body.liderancas[0].tipoLideranca).toBe("COMERCIAL");
    expect(body.liderancas[0].funcao).toBe("LIDER_COMERCIAL");
  });

  it("comerciais sem tipoLideranca e funcao retornam null", async () => {
    authenticate();
    prismaMock.equipe.findMany.mockResolvedValue([
      makeMembro({
        id: "com-2",
        nome: "Comercial Avulso",
        tipo: "COMERCIAL",
        tipoLideranca: null,
        funcao: null,
        usuario: { id: "u-4", email: "avulso@teste.com", status: "ATIVO" },
      }),
    ]);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/equipe"));
    const body = (await response.json()) as { comerciais: Array<{ tipo: string; tipoLideranca: string | null; funcao: string | null }> };

    expect(body.comerciais[0].tipo).toBe("COMERCIAL");
    expect(body.comerciais[0].tipoLideranca).toBeNull();
    expect(body.comerciais[0].funcao).toBeNull();
  });

  it("retorna ambos liderancas e comerciais com tipo corretamente", async () => {
    authenticate();
    prismaMock.equipe.findMany.mockResolvedValue([
      makeMembro({
        id: "lid-2",
        nome: "Gerente",
        tipo: "LIDERANCA",
        tipoLideranca: "GESTOR",
        funcao: "GERENTE_CIRE",
        usuario: { id: "u-5", email: "gerente@teste.com", status: "ATIVO" },
      }),
      makeMembro({
        id: "com-3",
        nome: "Vendedor",
        tipo: "COMERCIAL",
        tipoLideranca: null,
        funcao: "VENDEDOR",
        usuario: { id: "u-6", email: "vendedor@teste.com", status: "ATIVO" },
      }),
    ]);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/equipe"));
    const body = (await response.json()) as {
      liderancas: Array<{ id: string; tipo: string }>;
      comerciais: Array<{ id: string; tipo: string }>
    };

    expect(response.status).toBe(200);
    expect(body.liderancas).toHaveLength(1);
    expect(body.comerciais).toHaveLength(1);
    expect(body.liderancas[0].tipo).toBe("LIDERANCA");
    expect(body.comerciais[0].tipo).toBe("COMERCIAL");
  });
});
