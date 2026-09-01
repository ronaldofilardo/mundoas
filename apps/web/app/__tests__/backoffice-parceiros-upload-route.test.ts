import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/v1/backoffice/parceiros/upload/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { read, utils } from "xlsx";
import { criarAuditLog } from "@/lib/audit";
import { validarCPF } from "@/lib/pontos-utils";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  forbidden: () => Response.json({ error: "Acesso negado" }, { status: 403 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    usuario: { create: vi.fn(), findUnique: vi.fn() },
    parceiro: { findFirst: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(),
}));

vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn(),
}));

vi.mock("@/lib/pontos-utils", () => ({
  validarCPF: vi.fn(),
}));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);
const hashMock = vi.mocked(hash);
const xlsxReadMock = vi.mocked(read);
const xlsxUtilsMock = vi.mocked(utils);
const auditLogMock = vi.mocked(criarAuditLog);
const validarCpfMock = vi.mocked(validarCPF);

function makeFormDataRequest(file: File): NextRequest {
  const formData = new FormData();
  formData.append("file", file);

  return {
    formData: async () => formData,
    headers: new Headers(),
    url: "http://localhost/api/v1/backoffice/parceiros/upload",
  } as unknown as NextRequest;
}

describe("API - Backoffice Parceiros Upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
      backofficeId: "backoffice-1",
      error: null,
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
    validarCpfMock.mockReturnValue(true);
    hashMock.mockResolvedValue("hashed-password" as unknown as never);
    xlsxReadMock.mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    } as unknown as never);
    xlsxUtilsMock.sheet_to_json = vi.fn().mockReturnValue([]) as unknown as typeof utils.sheet_to_json;
  });

  it("retorna 401 sem escopo de backoffice", async () => {
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);

    const file = new File(["test"], "teste.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const req = makeFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("retorna 400 se o arquivo não for enviado", async () => {
    const req = {
      formData: async () => {
        const fd = new FormData();
        return fd;
      },
      headers: new Headers(),
      url: "http://localhost/api/v1/backoffice/parceiros/upload",
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 400 para formato de arquivo inválido", async () => {
    const file = new File(["test"], "teste.pdf", { type: "application/pdf" });
    const req = makeFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("importa parceiros válidos de uma planilha xlsx", async () => {
    const file = new File(["dummy"], "parceiros.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    xlsxUtilsMock.sheet_to_json = vi.fn().mockReturnValue([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678901" },
      { Nome: "Maria Souza", Email: "maria@teste.com", CPF: "98765432100" },
    ]) as unknown as typeof utils.sheet_to_json;

    prismaMock.usuario.create = vi.fn().mockResolvedValue({ id: "user-1" }) as unknown as typeof prisma.usuario.create;
    prismaMock.parceiro.findFirst = vi.fn().mockResolvedValue(null) as unknown as typeof prisma.parceiro.findFirst;
    prismaMock.usuario.findUnique = vi.fn().mockResolvedValue(null) as unknown as typeof prisma.usuario.findUnique;
    prismaMock.parceiro.create = vi.fn().mockResolvedValue({ id: "parceiro-1" }) as unknown as typeof prisma.parceiro.create;

    const req = makeFormDataRequest(file);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.criados).toBe(2);
    expect(body.erros).toBe(0);
    expect(prismaMock.usuario.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.parceiro.create).toHaveBeenCalledTimes(2);
  });

  it("retorna erro para CPF inválido", async () => {
    const file = new File(["dummy"], "parceiros.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    xlsxUtilsMock.sheet_to_json = vi.fn().mockReturnValue([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "123" },
    ]) as unknown as typeof utils.sheet_to_json;

    const req = makeFormDataRequest(file);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.erros).toBe(1);
    expect(body.detalhes[0].mensagem).toContain("CPF deve ter no mínimo 11 caracteres");
  });

  it("retorna erro para CPF duplicado", async () => {
    const file = new File(["dummy"], "parceiros.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    xlsxUtilsMock.sheet_to_json = vi.fn().mockReturnValue([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678901" },
    ]) as unknown as typeof utils.sheet_to_json;

    prismaMock.parceiro.findFirst = vi.fn().mockResolvedValue({ id: "existing" }) as unknown as typeof prisma.parceiro.findFirst;

    const req = makeFormDataRequest(file);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.erros).toBe(1);
    expect(body.detalhes[0].mensagem).toContain("CPF já cadastrado");
  });

  it("retorna erro para email duplicado", async () => {
    const file = new File(["dummy"], "parceiros.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    xlsxUtilsMock.sheet_to_json = vi.fn().mockReturnValue([
      { Nome: "João Silva", Email: "joao@teste.com", CPF: "12345678901" },
    ]) as unknown as typeof utils.sheet_to_json;

    prismaMock.parceiro.findFirst = vi.fn().mockResolvedValue(null) as unknown as typeof prisma.parceiro.findFirst;
    prismaMock.usuario.findUnique = vi.fn().mockResolvedValue({ id: "existing-user" }) as unknown as typeof prisma.usuario.findUnique;

    const req = makeFormDataRequest(file);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.erros).toBe(1);
    expect(body.detalhes[0].mensagem).toContain("Email já cadastrado");
  });

  it("rejeita arquivo vazio", async () => {
    const file = new File([""], "vazio.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const req = makeFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("rejeita arquivo maior que 5MB", async () => {
    const largeContent = new Array(6 * 1024 * 1024).fill("x").join("");
    const file = new File([largeContent], "grande.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const req = makeFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("rejeita mais de 500 linhas", async () => {
    const file = new File(["dummy"], "muitas.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const linhas = Array.from({ length: 501 }, (_, i) => ({
      Nome: `Parceiro ${i}`,
      Email: `p${i}@teste.com`,
      CPF: String(i).padStart(11, "0"),
    }));

    xlsxUtilsMock.sheet_to_json = vi.fn().mockReturnValue(linhas) as unknown as typeof utils.sheet_to_json;

    const req = makeFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
