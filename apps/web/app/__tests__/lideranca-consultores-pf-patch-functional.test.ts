import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
      headers: new Headers(),
    }),
  },
}));

vi.mock("@/lib/api-helpers", () => ({
  requireLiderancaWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultorPf: { findUnique: vi.fn(), update: vi.fn() },
    usuario: { findUnique: vi.fn(), update: vi.fn() },
    setor: { findMany: vi.fn() },
    consultorPfSetor: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { PATCH } from "@/app/api/v1/lideranca/consultores-pf/[id]/route";
import { requireLiderancaWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

const scopeMock = vi.mocked(requireLiderancaWithScope);
const prismaMock = vi.mocked(prisma);

const LIDERANCA_ID = "lideranca-uuid-1";
const CONSULTOR_ID = "consultor-uuid-1";
const USUARIO_ID = "usuario-uuid-1";

function authenticate(): void {
  scopeMock.mockResolvedValue({
    lideranca: { id: LIDERANCA_ID, backofficeId: "bo-1", tipo: "COMERCIAL" },
    error: null,
  } as any);
}

function patchRequest(body: unknown) {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({ "content-type": "application/json" }),
    url: `http://localhost/api/v1/lideranca/consultores-pf/${CONSULTOR_ID}`,
  } as unknown as NextRequest;
}

function mockConsultor(overrides: Record<string, unknown> = {}) {
  return {
    id: CONSULTOR_ID,
    usuarioId: USUARIO_ID,
    nome: "Consultor Original",
    cpf: "11122233344",
    liderancaId: LIDERANCA_ID,
    status: "ATIVO",
    ...overrides,
    usuario: {
      id: USUARIO_ID,
      nome: "Consultor Original",
      email: "original@teste.com",
      telefone: "11988887777",
      status: "ATIVO",
    },
  };
}

describe("PATCH /api/v1/lideranca/consultores-pf/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticate();
  });

  describe("atualização de nome", () => {
    it("atualiza nome no usuario e consultorPf", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);

      const tx = {
        usuario: { update: vi.fn().mockResolvedValue({ id: USUARIO_ID, nome: "Novo Nome" }) },
        consultorPf: { update: vi.fn().mockResolvedValue({ id: CONSULTOR_ID, nome: "Novo Nome" }) },
      };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const res = await PATCH(patchRequest({ nome: "Novo Nome" }), { params: { id: CONSULTOR_ID } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.nome).toBe("Novo Nome");
      expect(tx.usuario.update).toHaveBeenCalledWith({
        where: { id: USUARIO_ID },
        data: { nome: "Novo Nome" },
      });
    });
  });

  describe("atualização de email", () => {
    it("atualiza email quando válido e único", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      const tx = {
        usuario: { update: vi.fn().mockResolvedValue({ id: USUARIO_ID, email: "novo@teste.com" }) },
        consultorPf: { update: vi.fn().mockResolvedValue({ id: CONSULTOR_ID }) },
      };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const res = await PATCH(patchRequest({ email: "novo@teste.com" }), { params: { id: CONSULTOR_ID } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.email).toBe("novo@teste.com");
      expect(tx.usuario.update).toHaveBeenCalledWith({
        where: { id: USUARIO_ID },
        data: { email: "novo@teste.com" },
      });
    });

    it("rejeita email duplicado de outro usuário", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: "outro-usuario-id" } as any);

      const res = await PATCH(patchRequest({ email: "duplicado@teste.com" }), { params: { id: CONSULTOR_ID } });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("Email já cadastrado");
    });

    it("permite manter o mesmo email do consultor", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);
      prismaMock.usuario.findUnique.mockResolvedValue({ id: USUARIO_ID } as any);

      const tx = {
        usuario: { update: vi.fn().mockResolvedValue({ id: USUARIO_ID }) },
        consultorPf: { update: vi.fn().mockResolvedValue({ id: CONSULTOR_ID }) },
      };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const res = await PATCH(patchRequest({ email: "original@teste.com" }), { params: { id: CONSULTOR_ID } });

      expect(res.status).toBe(200);
    });
  });

  describe("atualização de CPF", () => {
    it("atualiza cpf quando único", async () => {
      prismaMock.consultorPf.findUnique
        .mockResolvedValueOnce(mockConsultor() as any)
        .mockResolvedValueOnce(null);

      const tx = {
        usuario: { update: vi.fn().mockResolvedValue({ id: USUARIO_ID }) },
        consultorPf: { update: vi.fn().mockResolvedValue({ id: CONSULTOR_ID, cpf: "99988877766" }) },
      };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const res = await PATCH(patchRequest({ cpf: "99988877766" }), { params: { id: CONSULTOR_ID } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.cpf).toBe("99988877766");
      expect(tx.consultorPf.update).toHaveBeenCalledWith({
        where: { id: CONSULTOR_ID },
        data: expect.objectContaining({ cpf: "99988877766" }),
      });
    });

    it("rejeita CPF duplicado de outro consultor", async () => {
      prismaMock.consultorPf.findUnique
        .mockResolvedValueOnce(mockConsultor() as any)
        .mockResolvedValueOnce({ id: "outro-consultor-id" } as any);

      const res = await PATCH(patchRequest({ cpf: "11122233300" }), { params: { id: CONSULTOR_ID } });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("CPF já cadastrado");
    });

    it("rejeita CPF com formato inválido", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);

      const res = await PATCH(patchRequest({ cpf: "123" }), { params: { id: CONSULTOR_ID } });
      const body = await res.json();

      expect(res.status).toBe(400);
    });
  });

  describe("atualização de setores", () => {
    it("substitui setores do consultor", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);
      prismaMock.setor.findMany.mockResolvedValue([
        { id: "setor-1", nome: "Saúde" },
        { id: "setor-2", nome: "Educação" },
      ] as any);

      const tx = {
        usuario: { update: vi.fn().mockResolvedValue({ id: USUARIO_ID }) },
        consultorPf: { update: vi.fn().mockResolvedValue({ id: CONSULTOR_ID }) },
        setor: { findMany: vi.fn().mockResolvedValue([
          { id: "setor-1", nome: "Saúde" },
          { id: "setor-2", nome: "Educação" },
        ]) },
        consultorPfSetor: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const res = await PATCH(patchRequest({ setores: ["Saúde", "Educação"] }), { params: { id: CONSULTOR_ID } });

      expect(res.status).toBe(200);
      expect(tx.consultorPfSetor.deleteMany).toHaveBeenCalledWith({
        where: { consultorPfId: CONSULTOR_ID },
      });
      expect(tx.consultorPfSetor.createMany).toHaveBeenCalledWith({
        data: [
          { consultorPfId: CONSULTOR_ID, setorId: "setor-1" },
          { consultorPfId: CONSULTOR_ID, setorId: "setor-2" },
        ],
      });
    });

    it("rejeita array de setores vazio", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);

      const res = await PATCH(patchRequest({ setores: [] }), { params: { id: CONSULTOR_ID } });
      const body = await res.json();

      expect(res.status).toBe(400);
    });
  });

  describe("atualização combinada", () => {
    it("atualiza nome, email, cpf e setores na mesma requisição", async () => {
      prismaMock.consultorPf.findUnique
        .mockResolvedValueOnce(mockConsultor() as any)
        .mockResolvedValueOnce(null);
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      prismaMock.setor.findMany.mockResolvedValue([{ id: "setor-1", nome: "Saúde" }] as any);

      const tx = {
        usuario: { update: vi.fn().mockResolvedValue({ id: USUARIO_ID }) },
        consultorPf: { update: vi.fn().mockResolvedValue({ id: CONSULTOR_ID }) },
        setor: { findMany: vi.fn().mockResolvedValue([{ id: "setor-1", nome: "Saúde" }]) },
        consultorPfSetor: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const res = await PATCH(
        patchRequest({ nome: "Novo Nome", email: "novo@teste.com", cpf: "99988877766", setores: ["Saúde"] }),
        { params: { id: CONSULTOR_ID } },
      );

      expect(res.status).toBe(200);
      expect(tx.usuario.update).toHaveBeenCalled();
      expect(tx.consultorPf.update).toHaveBeenCalled();
      expect(tx.consultorPfSetor.deleteMany).toHaveBeenCalled();
      expect(tx.consultorPfSetor.createMany).toHaveBeenCalled();
    });
  });

  describe("validação do schema", () => {
    it("rejeita nome muito curto", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);

      const res = await PATCH(patchRequest({ nome: "AB" }), { params: { id: CONSULTOR_ID } });
      expect(res.status).toBe(400);
    });

    it("rejeita email com formato inválido", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);

      const res = await PATCH(patchRequest({ email: "nao-e-email" }), { params: { id: CONSULTOR_ID } });
      expect(res.status).toBe(400);
    });

    it("rejeita status inválido", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(mockConsultor() as any);

      const res = await PATCH(patchRequest({ status: "PENDENTE" }), { params: { id: CONSULTOR_ID } });
      expect(res.status).toBe(400);
    });
  });

  describe("segurança", () => {
    it("retorna 404 quando consultor não pertence à liderança", async () => {
      prismaMock.consultorPf.findUnique.mockResolvedValue(
        mockConsultor({ liderancaId: "outra-lideranca-id" }) as any,
      );

      const res = await PATCH(patchRequest({ nome: "Hack" }), { params: { id: CONSULTOR_ID } });
      expect(res.status).toBe(404);
    });
  });
});
