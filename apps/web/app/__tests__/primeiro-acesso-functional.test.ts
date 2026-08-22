import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/auth/primeiro-acesso/route";
import { prisma } from "@asa/database";
import { compare, hash } from "bcryptjs";
import { criarAuditLog } from "@/lib/audit";

type RequestBody = { senhaAtual?: unknown; novaSenha?: unknown };

vi.mock("@asa/database", () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({ criarAuditLog: vi.fn() }));

vi.mock("@/lib/api-helpers", () => ({
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  ok: (data: unknown) => Response.json(data, { status: 200 }),
  unauthorized: () => Response.json({ error: "Não autorizado" }, { status: 401 }),
}));

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      Response.json(data, { status: init?.status ?? 200 }),
  },
}));

const prismaMock = vi.mocked(prisma);
const compareMock = vi.mocked(compare);
const hashMock = vi.mocked(hash);
const auditMock = vi.mocked(criarAuditLog);
const fetchMock = vi.fn();

function request(body: RequestBody, cookie = "next-auth.session-token=session") {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({ cookie }),
  } as never;
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("POST /api/v1/auth/primeiro-acesso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      Response.json({ user: { id: "usuario-1" } }, { status: 200 }),
    );
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: "usuario-1",
      senhaHash: "hash-atual",
      senhaTemporaria: true,
      email: "usuario@teste.com",
      nome: "Usuário Teste",
      tipo: "CONSULTOR",
    } as never);
    compareMock.mockResolvedValue(true as never);
    hashMock.mockResolvedValue("hash-nova" as never);
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        usuario: { update: vi.fn().mockResolvedValue({}) },
      } as never),
    );
    auditMock.mockResolvedValue(undefined);
  });

  it("rejeita payload incompleto antes de consultar a sessão", async () => {
    const response = await POST(request({ senhaAtual: "antiga" }));

    expect(response.status).toBe(400);
    expect(await bodyOf(response)).toEqual({
      error: "Senha atual e nova senha são obrigatórias",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retorna 401 quando a sessão não está disponível", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 401 }));

    const response = await POST(
      request({ senhaAtual: "Antiga1!", novaSenha: "NovaSenha1!" }),
    );

    expect(response.status).toBe(401);
    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("rejeita senha nova fraca sem comparar ou atualizar", async () => {
    const response = await POST(request({ senhaAtual: "Antiga1!", novaSenha: "fraca" }));

    expect(response.status).toBe(400);
    expect(await bodyOf(response)).toMatchObject({
      error: expect.stringContaining("Mínimo 8 caracteres"),
    });
    expect(compareMock).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejeita usuário que já concluiu o primeiro acesso", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: "usuario-1",
      senhaHash: "hash-atual",
      senhaTemporaria: false,
      email: "usuario@teste.com",
      nome: "Usuário Teste",
      tipo: "CONSULTOR",
    } as never);

    const response = await POST(
      request({ senhaAtual: "Antiga1!", novaSenha: "NovaSenha1!" }),
    );

    expect(response.status).toBe(400);
    expect(await bodyOf(response)).toEqual({
      error: "Senha já foi alterada anteriormente",
    });
  });

  it("altera a senha em transação e registra auditoria", async () => {
    const response = await POST(
      request({ senhaAtual: "Antiga1!", novaSenha: "NovaSenha1!" }),
    );

    expect(response.status).toBe(200);
    expect(await bodyOf(response)).toEqual({ message: "Senha alterada com sucesso" });
    expect(compareMock).toHaveBeenCalledWith("Antiga1!", "hash-atual");
    expect(hashMock).toHaveBeenCalledWith("NovaSenha1!", 12);
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "usuario-1",
        acao: "ALTERAR_SENHA_PRIMEIRO_ACESSO",
        entidade: "usuario",
        entidadeId: "usuario-1",
      }),
    );
  });
});
