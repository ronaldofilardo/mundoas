import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/backoffice/onboarding/plano/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    backoffice: { findUnique: vi.fn() },
    assinatura: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

const requireBackofficeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);

function authenticate(backofficeId: string = "backoffice-1"): void {
  requireBackofficeMock.mockResolvedValue({
    backofficeId,
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

describe("API backoffice/onboarding/plano — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireBackofficeMock.mockResolvedValue({
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  describe("GET", () => {
    it("retorna 401 sem autenticação", async () => {
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("retorna dados da unidade e status da assinatura", async () => {
      authenticate();
      prismaMock.backoffice.findUnique.mockResolvedValue({
        id: "backoffice-1",
        razaoSocial: "Unidade Teste",
        cnpj: "12345678000199",
        cep: "01001-000",
        logradouro: "Rua Teste",
        numero: "1",
        complemento: null,
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        telefone: "(11) 99999-9999",
        usuario: { email: "teste@asa.test" },
        assinatura: { statusAssinatura: "PENDENTE_PAGAMENTO", planoAssinatura: null },
      } as never);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.dados.razaoSocial).toBe("Unidade Teste");
      expect(body.statusAssinatura).toBe("PENDENTE_PAGAMENTO");
      expect(body.planoAtual).toBeNull();
    });
  });

  describe("POST", () => {
    it("retorna 401 sem autenticação", async () => {
      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: "MENSAL" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("rejeita plano inválido", async () => {
      authenticate();

      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: "INVALIDO" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("Selecione um plano válido");
      expect(prismaMock.assinatura.update).not.toHaveBeenCalled();
    });

    it("bloqueia escolha de plano enquanto estiver em PENDENTE_TERMOS", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue({
        id: "assinatura-1",
        statusAssinatura: "PENDENTE_TERMOS",
      });

      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: "MENSAL" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("aceitar os termos");
      expect(prismaMock.assinatura.update).not.toHaveBeenCalled();
    });

    it("grava plano escolhido quando status permite", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue({
        id: "assinatura-1",
        statusAssinatura: "PENDENTE_PAGAMENTO",
      });
      prismaMock.assinatura.update.mockResolvedValue({ id: "assinatura-1", planoAssinatura: "ANUAL" } as never);

      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: "ANUAL" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.plano).toBe("ANUAL");
      expect(prismaMock.assinatura.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "assinatura-1" },
          data: { planoAssinatura: "ANUAL" },
        }),
      );
    });
  });
});
