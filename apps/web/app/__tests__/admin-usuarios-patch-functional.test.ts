import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "@/app/api/v1/admin/usuarios/[id]/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn(),
}));

vi.mock("@asa/database", () => {
  const usuarioUpdate = vi.fn().mockResolvedValue({});
  const backofficeUpdate = vi.fn().mockResolvedValue({});
  return {
    prisma: {
      backoffice: {
        findUnique: vi.fn(),
        update: backofficeUpdate,
      },
      consultor: {
        findUnique: vi.fn(),
      },
      usuario: {
        findFirst: vi.fn(),
        update: usuarioUpdate,
      },
      $transaction: vi.fn(async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
        const tx = {
          usuario: { update: usuarioUpdate },
          backoffice: { update: backofficeUpdate },
        };
        await fn(tx);
      }),
    },
  };
});

type AdminSession = { user: { id: string; tipo: "ADMIN" } };

const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);

function authenticateAdmin(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

function patchRequest(id: string, type: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost/api/v1/admin/usuarios/${id}?type=${type}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API admin/usuarios/[id] PATCH — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 para sessão ausente", async () => {
    const response = await PATCH(patchRequest("bo-1", "BACKOFFICE", { nome: "X" }), { params: { id: "bo-1" } });

    expect(response.status).toBe(401);
  });

  it("retorna 400 para type inválido", async () => {
    authenticateAdmin();
    const response = await PATCH(patchRequest("id-1", "INVALID", { nome: "X" }), { params: { id: "id-1" } });

    expect(response.status).toBe(400);
  });

  describe("BACKOFFICE", () => {
    it("retorna 404 se backoffice não encontrado", async () => {
      authenticateAdmin();
      prismaMock.backoffice.findUnique.mockResolvedValue(null);

      const response = await PATCH(patchRequest("bo-1", "BACKOFFICE", { nome: "X" }), { params: { id: "bo-1" } });

      expect(response.status).toBe(404);
    });

    it("retorna 400 se email já cadastrado em outro usuário", async () => {
      authenticateAdmin();
      prismaMock.backoffice.findUnique.mockResolvedValue({ id: "bo-1", usuarioId: "u-1" });
      prismaMock.usuario.findFirst.mockResolvedValue({ id: "u-other" });

      const response = await PATCH(patchRequest("bo-1", "BACKOFFICE", { email: "dup@test.com" }), { params: { id: "bo-1" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Email já cadastrado");
    });

    it("atualiza dados do usuario e do backoffice em transaction", async () => {
      authenticateAdmin();
      prismaMock.backoffice.findUnique.mockResolvedValue({ id: "bo-1", usuarioId: "u-1" });
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.update.mockResolvedValue({});
      prismaMock.backoffice.update.mockResolvedValue({});

      const response = await PATCH(
        patchRequest("bo-1", "BACKOFFICE", {
          nome: "Nova Unidade",
          email: "novo@test.com",
          telefone: "11999999999",
          razaoSocial: "Nova Razão",
          cnpj: "12345678000190",
          cep: "80010000",
          logradouro: "Rua Nova",
          numero: "200",
          complemento: "Sala 2",
          bairro: "Batel",
          cidade: "Curitiba",
          uf: "PR",
        }),
        { params: { id: "bo-1" } },
      );

      expect(response.status).toBe(200);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: expect.objectContaining({ nome: "Nova Unidade", email: "novo@test.com", telefone: "11999999999" }),
      });
      expect(prismaMock.backoffice.update).toHaveBeenCalledWith({
        where: { id: "bo-1" },
        data: expect.objectContaining({
          nome: "Nova Unidade",
          razaoSocial: "Nova Razão",
          cnpj: "12345678000190",
          cep: "80010000",
          logradouro: "Rua Nova",
          numero: "200",
          complemento: "Sala 2",
          bairro: "Batel",
          cidade: "Curitiba",
          uf: "PR",
        }),
      });
    });

    it("permite email igual ao atual (mesmo usuário)", async () => {
      authenticateAdmin();
      prismaMock.backoffice.findUnique.mockResolvedValue({ id: "bo-1", usuarioId: "u-1" });
      // Mock retorna null: nenhum OUTRO usuário com este email (o próprio não conta)
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.update.mockResolvedValue({});
      prismaMock.backoffice.update.mockResolvedValue({});

      const response = await PATCH(
        patchRequest("bo-1", "BACKOFFICE", { email: "atual@test.com" }),
        { params: { id: "bo-1" } },
      );

      expect(response.status).toBe(200);
    });

    it("atualiza apenas campos parciais", async () => {
      authenticateAdmin();
      prismaMock.backoffice.findUnique.mockResolvedValue({ id: "bo-1", usuarioId: "u-1" });
      prismaMock.usuario.update.mockResolvedValue({});
      prismaMock.backoffice.update.mockResolvedValue({});

      const response = await PATCH(
        patchRequest("bo-1", "BACKOFFICE", { nome: "Só Nome" }),
        { params: { id: "bo-1" } },
      );

      expect(response.status).toBe(200);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: { nome: "Só Nome" },
      });
    });
  });

  describe("CONSULTOR", () => {
    it("retorna 404 se consultor não encontrado", async () => {
      authenticateAdmin();
      prismaMock.consultor.findUnique.mockResolvedValue(null);

      const response = await PATCH(patchRequest("c-1", "CONSULTOR", { nome: "X" }), { params: { id: "c-1" } });

      expect(response.status).toBe(404);
    });

    it("retorna 400 se email já cadastrado", async () => {
      authenticateAdmin();
      prismaMock.consultor.findUnique.mockResolvedValue({ id: "c-1", usuarioId: "u-2" });
      prismaMock.usuario.findFirst.mockResolvedValue({ id: "u-other" });

      const response = await PATCH(patchRequest("c-1", "CONSULTOR", { email: "dup@test.com" }), { params: { id: "c-1" } });

      expect(response.status).toBe(400);
    });

    it("atualiza dados do consultor", async () => {
      authenticateAdmin();
      prismaMock.consultor.findUnique.mockResolvedValue({ id: "c-1", usuarioId: "u-2" });
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.update.mockResolvedValue({});

      const response = await PATCH(
        patchRequest("c-1", "CONSULTOR", { nome: "Novo Nome", email: "novo@test.com" }),
        { params: { id: "c-1" } },
      );

      expect(response.status).toBe(200);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: "u-2" },
        data: expect.objectContaining({ nome: "Novo Nome", email: "novo@test.com" }),
      });
    });
  });

  describe("GESTOR", () => {
    it("retorna 400 se email já cadastrado", async () => {
      authenticateAdmin();
      prismaMock.usuario.findFirst.mockResolvedValue({ id: "u-other" });

      const response = await PATCH(patchRequest("g-1", "GESTOR", { email: "dup@test.com" }), { params: { id: "g-1" } });

      expect(response.status).toBe(400);
    });

    it("atualiza dados do gestor", async () => {
      authenticateAdmin();
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.update.mockResolvedValue({});

      const response = await PATCH(
        patchRequest("g-1", "GESTOR", { nome: "Gestor Atualizado", telefone: "11888888888" }),
        { params: { id: "g-1" } },
      );

      expect(response.status).toBe(200);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: "g-1" },
        data: expect.objectContaining({ nome: "Gestor Atualizado", telefone: "11888888888" }),
      });
    });

    it("permite email igual ao atual", async () => {
      authenticateAdmin();
      // Mock retorna null: nenhum OUTRO usuário com este email
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.update.mockResolvedValue({});

      const response = await PATCH(
        patchRequest("g-1", "GESTOR", { email: "mesmo@test.com" }),
        { params: { id: "g-1" } },
      );

      expect(response.status).toBe(200);
    });
  });
});
