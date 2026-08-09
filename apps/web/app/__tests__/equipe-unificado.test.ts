/**
 * Teste de contrato do fluxo unificado Equipe (substitui a suíte legada de
 * comercial/lideranca que foi removida na migração Comercial+Lideranca -> Equipe).
 *
 * Valida o contrato da rota /api/v1/backoffice/equipe:
 *  - POST cria membro COMERCIAL (tipo:"COMERCIAL") e LIDERANCA (tipo:"LIDERANCA").
 *  - GET retorna árvore { liderancas, comerciais } derivada da tabela única equipe.
 *
 * Não depende de DB real: prisma e scopes são mockados.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do prisma ANTES de importar a rota
const prismaMock = {
  usuario: { create: vi.fn(), findUnique: vi.fn() },
  equipe: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@asa/database", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  ok: (data: unknown) => new Response(JSON.stringify(data), { status: 200 }),
  created: (data: unknown) => new Response(JSON.stringify(data), { status: 201 }),
  badRequest: (msg: string) => new Response(JSON.stringify({ error: msg }), { status: 400 }),
  forbidden: () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
}));

vi.mock("@/lib/utils", () => ({
  gerarSenhaProvisoria: () => "SENHA_TEMP_123",
}));

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn(),
}));

const { POST, GET } = await import("@/app/api/v1/backoffice/equipe/route");

function makeReq(body?: unknown, url = "http://localhost/api/v1/backoffice/equipe") {
  return {
    url,
    json: async () => body,
  } as any;
}

const BACKOFFICE_ID = "bo-1";

beforeEach(async () => {
  vi.clearAllMocks();
  const { requireBackofficeWithScope } = await import("@/lib/api-helpers");
  (requireBackofficeWithScope as any).mockResolvedValue({
    session: { user: { id: "admin-1" } },
    backofficeId: BACKOFFICE_ID,
    error: null,
  });
});

describe("POST /equipe - criação unificada", () => {
  it("cria um COMERCIAL com tipo correto e sem liderança", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.equipe.findUnique.mockResolvedValue(null);
    prismaMock.equipe.findUnique.mockResolvedValueOnce(null); // cpf check
    prismaMock.backoffice = { findUnique: vi.fn().mockResolvedValue({ id: BACKOFFICE_ID }) };
    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      const usuario = { id: "u-1", email: "c@asa.com" };
      const membro = {
        id: "eq-1",
        usuarioId: "u-1",
        nome: "Comercial Teste",
        cpf: "52998224725",
        tipo: "COMERCIAL",
        tipoLideranca: null,
        funcao: "SUPERVISOR_COMERCIAL",
        percentualComissao: 5,
        status: "ATIVO",
      };
      return fn({
        usuario: { create: vi.fn().mockResolvedValue(usuario) },
        equipe: { create: vi.fn().mockResolvedValue(membro) },
      });
    });

    const res = await POST(
      makeReq({
        nome: "Comercial Teste",
        email: "c@asa.com",
        cpf: "52998224725",
        tipo: "COMERCIAL",
        funcao: "SUPERVISOR_COMERCIAL",
        percentualComissao: 5,
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tipo).toBe("COMERCIAL");
    expect(body.tipoLideranca).toBeNull();
    // O prisma.equipe.create deve receber tipo:"COMERCIAL"
    const txFn = (prismaMock.$transaction as any).mock.calls[0][0];
    const ctx = {
      usuario: { create: vi.fn().mockResolvedValue({ id: "u-1" }) },
      equipe: { create: vi.fn().mockResolvedValue({}) },
    };
    await txFn(ctx);
    expect(ctx.equipe.create.mock.calls[0][0].data.tipo).toBe("COMERCIAL");
  });

  it("cria uma LIDERANCA exigindo tipoLideranca", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.equipe.findUnique.mockResolvedValue(null);
    prismaMock.backoffice = { findUnique: vi.fn().mockResolvedValue({ id: BACKOFFICE_ID }) };

    const res = await POST(
      makeReq({
        nome: "Lider Teste",
        email: "l@asa.com",
        cpf: "11144477735",
        tipo: "LIDERANCA",
        // sem tipoLideranca -> deve dar erro 400
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/tipo de liderança/i);
  });

  it("cria LIDERANCA COMERCIAL com tipoLideranca informado", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.equipe.findUnique.mockResolvedValue(null);
    prismaMock.backoffice = { findUnique: vi.fn().mockResolvedValue({ id: BACKOFFICE_ID }) };
    let capturedTipo = "";
    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      const ctx = {
        usuario: { create: vi.fn().mockResolvedValue({ id: "u-2", email: "l2@asa.com" }) },
        equipe: {
          create: vi.fn().mockImplementation((a: any) => {
            capturedTipo = a.data.tipo;
            return Promise.resolve({ id: "eq-2", ...a.data });
          }),
        },
      };
      return fn(ctx);
    });

    const res = await POST(
      makeReq({
        nome: "Lider Comercial",
        email: "l2@asa.com",
        cpf: "39053344705",
        tipo: "LIDERANCA",
        tipoLideranca: "COMERCIAL",
      }),
    );

    expect(res.status).toBe(201);
    expect(capturedTipo).toBe("LIDERANCA");
    const body = await res.json();
    expect(body.tipoLideranca).toBe("COMERCIAL");
  });
});

describe("GET /equipe - leitura em árvore", () => {
  it("retorna liderancas e comerciais derivados da tabela única equipe", async () => {
    prismaMock.equipe.findMany.mockResolvedValue([
      {
        id: "eq-l",
        tipo: "LIDERANCA",
        tipoLideranca: "COMERCIAL",
        nome: "Líder",
        cpf: "1114445556667777735",
        status: "ATIVO",
        usuario: { email: "l@asa.com" },
        lideranca: null,
        consultorPfs: [{ id: "cp1", nome: "CPF1", cpf: "22233344455566677555664445556667755", status: "ATIVO", usuario: { email: "cpf@asa.com" } }],
        subordinados: [
          { id: "eq-c", nome: "Sub", cpf: "3334445556667755566", funcao: "GERENTE_CIRE", percentualComissao: 3, status: "ATIVO", usuario: { email: "s@asa.com" } },
        ],
      },
      {
        id: "eq-c2",
        tipo: "COMERCIAL",
        tipoLideranca: null,
        nome: "Avulso",
        cpf: "44455566677",
        status: "ATIVO",
        usuario: { email: "a@asa.com" },
        lideranca: null,
        consultorPfs: [],
        subordinados: [],
      },
    ]);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.liderancas).toHaveLength(1);
    expect(body.liderancas[0].tipoLideranca).toBe("COMERCIAL");
    expect(body.liderancas[0].consultoresPf).toHaveLength(1);
    expect(body.liderancas[0].comerciais).toHaveLength(1);
    expect(body.comerciais).toHaveLength(1);
    expect(body.comerciais[0].id).toBe("eq-c2");
  });
});
