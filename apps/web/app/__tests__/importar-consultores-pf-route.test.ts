import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/v1/lideranca/equipe/consultores-pf/importar/route";
import { requireLiderancaWithScope } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { buscarSetoresDaRegraConsultores } from "@/lib/setores-regras";
import { hash } from "bcryptjs";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { read, utils } from "xlsx";

vi.mock("@/lib/api-helpers", () => ({
  requireLiderancaWithScope: vi.fn(),
  badRequest: (message: string) =>
    Response.json({ error: message }, { status: 400 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      // Execute callback with mock tx that has required methods
      const tx: PrismaMock = {
        usuario: {
          create: vi.fn().mockResolvedValue({ id: "user-1" }),
          findUnique: vi.fn(),
        },
        consultorPf: {
          create: vi.fn().mockResolvedValue({ id: "consultor-1" }),
          findUnique: vi.fn(),
        },
        consultorPfSetor: {
          createMany: vi.fn().mockResolvedValue(undefined),
        },
      };
      return cb(tx);
    }),
    usuario: { findUnique: vi.fn() },
    consultorPf: { findUnique: vi.fn() },
  } as unknown as typeof import("@/lib/db"),
}));

vi.mock("@/lib/setores-regras", () => ({
  buscarSetoresDaRegraConsultores: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  gerarSenhaProvisoria: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(),
}));

vi.mock("xlsx", () => ({
  read: vi.fn().mockReturnValue({
    SheetNames: ["Sheet1"],
    Sheets: { Sheet1: { "!ref": "A1:Z100" } },
    getCellValue: vi.fn(),
  } as unknown as never),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

const scopeMock = vi.mocked(requireLiderancaWithScope);
const prismaMock = vi.mocked(prisma);
const setoresMock = vi.mocked(buscarSetoresDaRegraConsultores);
const hashMock = vi.mocked(hash);
const senhaMock = vi.mocked(gerarSenhaProvisoria);
const xlsxReadMock = vi.mocked(read);
const xlsxUtilsMock = vi.mocked(utils);

const SETORES = [
  { id: "setor-comercial", nome: "Comercial" },
  { id: "setor-vendas", nome: "Vendas" },
];

function makeFormDataRequest(file: File): NextRequest {
  const formData = new FormData();
  formData.append("file", file);
  return {
    formData: async () => formData,
    headers: new Headers(),
    url: "http://localhost/api/v1/lideranca/equipe/consultores-pf/importar",
  } as unknown as NextRequest;
}

function linhasXlsx(rows: Array<Record<string, unknown>>): void {
  xlsxUtilsMock.sheet_to_json = vi
    .fn()
    .mockReturnValue(rows as unknown as Record<string, unknown>[]) as unknown as typeof utils.sheet_to_json;
  xlsxReadMock.mockReturnValue({
    SheetNames: ["Sheet1"],
    Sheets: { Sheet1: { "!ref": "A1:Z100" } } as never,
  } as unknown as ReturnType<typeof xlsxReadMock>);
}

describe("API - Lideranca Consultores PF Importar", () => {
beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: { user: { id: "lideranca-user", tipo: "LIDERANCA" } },
      liderancaId: "lideranca-1",
      backofficeId: "backoffice-1",
      lideranca: { id: "lideranca-1" },
      error: null,
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);
    setoresMock.mockResolvedValue(SETORES);
    senhaMock.mockReturnValue("senha-teste");
    hashMock.mockResolvedValue("hashed" as unknown as never);
    xlsxReadMock.mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    } as unknown as never);
    prismaMock.usuario.findUnique = vi.fn().mockResolvedValue(null) as never;
    prismaMock.consultorPf.findUnique = vi.fn().mockResolvedValue(null) as never;
  });

  it("retorna 401 sem escopo de liderança", async () => {
    scopeMock.mockResolvedValue({
      session: null,
      liderancaId: null,
      backofficeId: null,
      lideranca: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);

    const file = new File(["x"], "teste.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    expect(res.status).toBe(401);
  });

  it("retorna 400 sem backofficeId", async () => {
    scopeMock.mockResolvedValue({
      session: { user: { id: "lideranca-user", tipo: "LIDERANCA" } },
      liderancaId: "lideranca-1",
      backofficeId: null,
      lideranca: { id: "lideranca-1" },
      error: null,
    } as Awaited<ReturnType<typeof requireLiderancaWithScope>>);

    const file = new File(["x"], "teste.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    expect(res.status).toBe(403);
  });

  it("retorna 400 se o arquivo não for enviado", async () => {
    const req = {
      formData: async () => new FormData(),
      headers: new Headers(),
      url: "http://localhost/api/v1/lideranca/equipe/consultores-pf/importar",
    } as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 400 para formato inválido", async () => {
    const file = new File(["x"], "teste.pdf", { type: "application/pdf" });
    const res = await POST(makeFormDataRequest(file));
    expect(res.status).toBe(400);
  });

  it("retorna 400 para arquivo vazio", async () => {
    const file = new File([""], "vazio.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    expect(res.status).toBe(400);
  });

  it("retorna 400 para nenhuma linha no arquivo", async () => {
    linhasXlsx([]);
    const file = new File(["x"], "vazio.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    expect(res.status).toBe(400);
  });

  it("retorna 400 para mais de 500 linhas", async () => {
    linhasXlsx(
      Array.from({ length: 501 }, (_, i) => ({
        Nome: `Nome ${i}`,
        Email: `e${i}@teste.com`,
        CPF: String(i).padStart(11, "0"),
        Setores: "Comercial",
      })),
    );
    const file = new File(["x"], "muitas.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    expect(res.status).toBe(400);
  });

  it("importa consultores válidos com sucesso", async () => {
    linhasXlsx([
      {
        Nome: "João Silva",
        Email: "joao@teste.com",
        CPF: "12345678900",
        Setores: "Comercial",
      },
      {
        Nome: "Maria Souza",
        Email: "maria@teste.com",
        CPF: "98765432100",
        Setores: "Vendas",
      },
    ]);
    const file = new File(["x"], "consultores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.criados).toBe(2);
    expect(body.sucesso).toBe(2);
    expect(body.erros).toBe(0);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
  });

  it("retorna erro de validação para nome curto", async () => {
    linhasXlsx([
      { Nome: "ab", Email: "joao@teste.com", CPF: "12345678900", Setores: "Comercial" },
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678900", Setores: "Comercial" },
    ]);
    const file = new File(["x"], "consultores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    const body = await res.json();

    expect(body.erros).toBe(1);
    expect(body.criados).toBe(1);
    expect(body.detalhes[0].mensagem).toContain(
      "Nome obrigatório (mínimo 3 caracteres)",
    );
  });

  it("retorna erro quando não há setor informado", async () => {
    linhasXlsx([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678900", Setores: "" },
    ]);
    const file = new File(["x"], "consultores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    const body = await res.json();

    expect(body.erros).toBe(1);
    expect(body.detalhes[0].mensagem).toContain("Selecione ao menos um setor");
  });

  it("retorna erro para setor inválido", async () => {
    linhasXlsx([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678900", Setores: "Financeiro" },
    ]);
    const file = new File(["x"], "consultores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    const body = await res.json();

    expect(body.erros).toBe(1);
    expect(body.detalhes[0].mensagem).toContain("Setor(es) inválido(s): Financeiro");
  });

  it("retorna erro para email duplicado", async () => {
    linhasXlsx([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678900", Setores: "Comercial" },
    ]);
    prismaMock.usuario.findUnique = vi.fn().mockResolvedValue({ id: "u" }) as never;
    const file = new File(["x"], "consultores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    const body = await res.json();

    expect(body.erros).toBe(1);
    expect(body.detalhes[0].mensagem).toContain("Email já cadastrado");
  });

  it("retorna erro para CPF duplicado", async () => {
    linhasXlsx([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678900", Setores: "Comercial" },
    ]);
    prismaMock.consultorPf.findUnique = vi.fn().mockResolvedValue({ id: "c" }) as never;
    const file = new File(["x"], "consultores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const res = await POST(makeFormDataRequest(file));
    const body = await res.json();

    expect(body.erros).toBe(1);
    expect(body.detalhes[0].mensagem).toContain("CPF já cadastrado");
  });
});