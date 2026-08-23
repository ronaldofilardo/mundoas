import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/backoffice/equipe/route";
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

vi.mock("bcryptjs", () => ({ hash: vi.fn().mockResolvedValue("hash-teste") }));
vi.mock("@/lib/utils", () => ({ gerarSenhaProvisoria: vi.fn().mockReturnValue("senha-teste") }));
vi.mock("@/lib/audit", () => ({ criarAuditLog: vi.fn().mockResolvedValue(undefined) }));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);
const validBody = {
  nome: "Liderança Centro",
  email: "lider@teste.com",
  cpf: "52998224725",
  tipo: "LIDERANCA",
  tipoLideranca: "COMERCIAL",
};

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/backoffice/equipe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API backoffice/equipe — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem escopo", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/equipe"));

    expect(response.status).toBe(401);
  });

  it("separa lideranças e comerciais na listagem", async () => {
    authenticate();
    prismaMock.equipe.findMany.mockResolvedValue([
      {
        id: "lider-1",
        nome: "Liderança",
        tipo: "LIDERANCA",
        tipoLideranca: "COMERCIAL",
        cpf: "123",
        funcao: null,
        percentualComissao: 0,
        status: "ATIVO",
        liderancaId: null,
        createdAt: new Date(),
        usuario: { id: "u-1", email: "lider@teste.com", status: "ATIVO" },
        lideranca: null,
        consultorPfs: [],
        subordinados: [],
      },
      {
        id: "com-1",
        nome: "Comercial",
        tipo: "COMERCIAL",
        tipoLideranca: null,
        cpf: "456",
        funcao: "VENDEDOR",
        percentualComissao: 5,
        status: "ATIVO",
        liderancaId: null,
        createdAt: new Date(),
        usuario: { id: "u-2", email: "com@teste.com", status: "ATIVO" },
        lideranca: null,
        consultorPfs: [],
        subordinados: [],
      },
    ] as Awaited<ReturnType<typeof prisma.equipe.findMany>>);

    const response = await GET(new NextRequest("http://localhost/api/v1/backoffice/equipe"));
    const body = (await response.json()) as { liderancas: unknown[]; comerciais: unknown[] };

    expect(response.status).toBe(200);
    expect(body.liderancas).toHaveLength(1);
    expect(body.comerciais).toHaveLength(1);
  });

  it("rejeita liderança sem tipo de liderança", async () => {
    authenticate();

    const response = await POST(request({ ...validBody, tipoLideranca: undefined }));

    expect(response.status).toBe(400);
    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("rejeita email duplicado", async () => {
    authenticate();
    prismaMock.usuario.findUnique.mockResolvedValue({ id: "usuario-existente" } as Awaited<
      ReturnType<typeof prisma.usuario.findUnique>
    >);

    const response = await POST(request(validBody));

    expect(response.status).toBe(400);
    expect(prismaMock.equipe.findUnique).not.toHaveBeenCalled();
  });

  it("cria membro e usuário em transação", async () => {
    authenticate();
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.equipe.findUnique.mockResolvedValue(null);
    prismaMock.backoffice.findUnique.mockResolvedValue({ id: "backoffice-1" } as Awaited<
      ReturnType<typeof prisma.backoffice.findUnique>
    >);
    const transactionClient = {
      usuario: { create: vi.fn().mockResolvedValue({ id: "usuario-1" }) },
      equipe: {
        create: vi.fn().mockResolvedValue({
          id: "equipe-1",
          tipoLideranca: "COMERCIAL",
          funcao: null,
          percentualComissao: 0,
          status: "ATIVO",
        }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(transactionClient));

    const response = await POST(request(validBody));
    const body = (await response.json()) as { id: string; tipo: string; cpf: string };

    expect(response.status).toBe(201);
    expect(body).toMatchObject({ id: "equipe-1", tipo: "LIDERANCA", cpf: "52998224725" });
    expect(transactionClient.equipe.create).toHaveBeenCalledOnce();
  });
});
