import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET,
  POST,
} from "@/app/api/v1/lideranca/consultores-pf/route";
import { requireLiderancaWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireLiderancaWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
  created: (data: unknown) => Response.json(data, { status: 201 }),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultorPf: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    usuario: { findUnique: vi.fn(), create: vi.fn() },
    setor: { findMany: vi.fn(), upsert: vi.fn() },
    consultorPfSetor: { createMany: vi.fn() },
    regraComercial: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({ hash: vi.fn().mockResolvedValue("hash-teste") }));
vi.mock("@/lib/utils", () => ({ gerarSenhaProvisoria: vi.fn().mockReturnValue("senha-teste") }));

type ScopeResult = {
  lideranca: { id: string } | null;
  error: Response | null;
};

const scopeMock = vi.mocked(requireLiderancaWithScope);
const prismaMock = vi.mocked(prisma);
const params = { lideranca: { id: "lideranca-1", backofficeId: "backoffice-1" }, error: null };

function authenticate(): void {
  scopeMock.mockResolvedValue(params as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
}

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/lideranca/consultores-pf", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  nome: "Consultor PF",
  email: "consultor@teste.com",
  cpf: "12345678901",
  telefone: "11999999999",
  setores: ["Saúde"],
};

describe("API lideranca/consultores-pf — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      lideranca: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
  });

  it("retorna 401 sem liderança autenticada", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(prismaMock.consultorPf.findMany).not.toHaveBeenCalled();
  });

  it("rejeita payload sem setor", async () => {
    authenticate();

    const response = await POST(request({ ...validBody, setores: [] }));

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
    expect(prismaMock.consultorPf.findUnique).not.toHaveBeenCalled();
  });

  it("rejeita setor inexistente ou inativo", async () => {
    authenticate();
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.consultorPf.findUnique.mockResolvedValue(null);
    prismaMock.setor.findMany.mockResolvedValue([]);

    const response = await POST(request(validBody));

    expect(response.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("cria usuário, consultor PF e vínculos de setor em transação", async () => {
    authenticate();
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.consultorPf.findUnique.mockResolvedValue(null);
    prismaMock.regraComercial.findUnique.mockResolvedValue({
      itens: [{ nome: "Saúde", ordem: 1 }],
    } as any);
    prismaMock.setor.findMany.mockResolvedValue([
      { id: "setor-1", nome: "Saúde" },
    ] as Awaited<ReturnType<typeof prisma.setor.findMany>>);

    const transactionClient = {
      usuario: { create: vi.fn().mockResolvedValue({ id: "usuario-1" }) },
      consultorPf: { create: vi.fn().mockResolvedValue({ id: "consultor-1" }) },
      consultorPfSetor: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(transactionClient));

    const response = await POST(request(validBody));
    const body = (await response.json()) as {
      id: string;
      email: string;
      cpf: string;
      setores: Array<{ id: string; nome: string }>;
    };

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      id: "consultor-1",
      email: "consultor@teste.com",
      cpf: "12345678901",
      setores: [{ id: "setor-1", nome: "Saúde" }],
    });
    expect(transactionClient.consultorPfSetor.createMany).toHaveBeenCalledWith({
      data: [{ consultorPfId: "consultor-1", setorId: "setor-1" }],
    });
  });
});
