import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST, GET } from "@/app/api/v1/admin/backoffices/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  badRequest: (message: string, details?: unknown) =>
    Response.json({ error: message, details }, { status: 400 }),
  created: (data: unknown) => Response.json(data, { status: 201 }),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    backoffice: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    assinatura: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({ criarAuditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/utils", () => ({ gerarSenhaProvisoria: vi.fn().mockReturnValue("senha-teste") }));
vi.mock("bcryptjs", () => ({ hash: vi.fn().mockResolvedValue("hash-teste") }));

type AdminSession = {
  user: {
    id: string;
    tipo: "ADMIN";
  };
};

type AdminAuthResult = {
  session: AdminSession | null;
  error: Response | null;
};

type TransactionClient = {
  usuario: { create: ReturnType<typeof vi.fn> };
  backoffice: { create: ReturnType<typeof vi.fn> };
  assinatura: { create: ReturnType<typeof vi.fn> };
};

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);

function authAsAdmin(): void {
  const result: AdminAuthResult = {
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  };
  requireAdminMock.mockResolvedValue(result as Awaited<ReturnType<typeof requireAdmin>>);
}

function requestWithBody(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/backoffices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function responseBody(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("API admin/backoffices — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 quando a sessão não existe", async () => {
    const response = await POST(requestWithBody({}));

    expect(response.status).toBe(401);
  });

  it("retorna 400 quando o payload obrigatório está incompleto", async () => {
    authAsAdmin();

    const response = await POST(requestWithBody({ nome: "Unidade" }));

    expect(response.status).toBe(400);
    expect(await responseBody(response)).toMatchObject({
      error: "Informe nome, email e CPF da unidade.",
    });
  });

  it("retorna 400 para CPF inválido antes de consultar o banco", async () => {
    authAsAdmin();

    const response = await POST(
      requestWithBody({ nome: "Unidade", email: "u@teste.com", cpf: "123" }),
    );

    expect(response.status).toBe(400);
    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o email já está cadastrado", async () => {
    authAsAdmin();
    const existingUser = { id: "usuario-existente" } as NonNullable<
      Awaited<ReturnType<typeof prisma.usuario.findUnique>>
    >;
    prismaMock.usuario.findUnique.mockResolvedValue(existingUser);

    const response = await POST(
      requestWithBody({
        nome: "Unidade",
        email: "u@teste.com",
        cpf: "12345678901",
      }),
    );

    expect(response.status).toBe(400);
    expect(await responseBody(response)).toMatchObject({
      error: "Email já cadastrado no sistema.",
    });
  });

  it("cria usuário, backoffice e assinatura na mesma transação", async () => {
    authAsAdmin();
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.backoffice.findUnique.mockResolvedValue(null);

    const transactionClient: TransactionClient = {
      usuario: { create: vi.fn().mockResolvedValue({ id: "usuario-1" }) },
      backoffice: { create: vi.fn().mockResolvedValue({ id: "backoffice-1" }) },
      assinatura: {
        create: vi.fn().mockResolvedValue({ statusAssinatura: "CORTESIA" }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(transactionClient));

    const response = await POST(
      requestWithBody({
        nome: "Unidade Centro",
        email: "centro@teste.com",
        cpf: "123.456.789-01",
      }),
    );

    expect(response.status).toBe(201);
    expect(await responseBody(response)).toMatchObject({
      id: "backoffice-1",
      usuarioId: "usuario-1",
      cpf: "12345678901",
      statusAssinatura: "CORTESIA",
      senhaTemporaria: "senha-teste",
    });
    expect(transactionClient.usuario.create).toHaveBeenCalledOnce();
    expect(transactionClient.backoffice.create).toHaveBeenCalledOnce();
    expect(transactionClient.assinatura.create).toHaveBeenCalledOnce();
  });

  it("lista backoffices para um administrador", async () => {
    authAsAdmin();
    const records = [{ id: "backoffice-1", nome: "Unidade Centro" }] as Awaited<
      ReturnType<typeof prisma.backoffice.findMany>
    >;
    prismaMock.backoffice.findMany.mockResolvedValue(records);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(records);
  });
});

