import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/v1/backoffice/onboarding/termos/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { TERMOS_VERSAO } from "@/lib/legal/mundoas-termos";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@/lib/legal/mundoas-termos", () => ({
  TERMOS_VERSAO: "2026-09-02-v1",
}));

vi.mock("@asa/database", () => ({
  prisma: {
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

describe("API backoffice/onboarding/termos — contrato funcional", () => {
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

    it("retorna status quando unidade não possui assinatura", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        versaoVigente: TERMOS_VERSAO,
        statusAssinatura: null,
        jaAceitou: false,
      });
    });

    it("retorna jaAceitou=true quando termos estão aceitos com versão vigente", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue({
        statusAssinatura: "PENDENTE_PAGAMENTO",
        termosAceitosEm: new Date("2026-09-02T10:00:00Z"),
        termosVersao: TERMOS_VERSAO,
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.jaAceitou).toBe(true);
      expect(body.statusAssinatura).toBe("PENDENTE_PAGAMENTO");
    });

    it("retorna jaAceitou=false quando versão dos termos é diferente da vigente", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue({
        statusAssinatura: "ATIVA",
        termosAceitosEm: new Date("2026-09-02T10:00:00Z"),
        termosVersao: "2026-08-01-v1",
      });

      const response = await GET();
      const body = await response.json();

      expect(body.jaAceitou).toBe(false);
    });
  });

  describe("POST", () => {
    it("retorna 401 sem autenticação", async () => {
      const response = await POST(new NextRequest("http://localhost", { method: "POST" }));
      expect(response.status).toBe(401);
    });

    it("rejeita quando não aceita todos os 3 documentos", async () => {
      authenticate();
      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceiteTermosUso: true, aceitePrivacidade: false, aceiteDebitoRecorrente: true }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("3 documentos");
      expect(prismaMock.assinatura.update).not.toHaveBeenCalled();
    });

    it("avança status de PENDENTE_TERMOS para PENDENTE_PAGAMENTO ao aceitar termos", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue({
        id: "assinatura-1",
        statusAssinatura: "PENDENTE_TERMOS",
      });
      prismaMock.assinatura.update.mockResolvedValue({ statusAssinatura: "PENDENTE_PAGAMENTO" } as never);

      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceiteTermosUso: true, aceitePrivacidade: true, aceiteDebitoRecorrente: true }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.statusAssinatura).toBe("PENDENTE_PAGAMENTO");
      expect(prismaMock.assinatura.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            termosAceitosEm: expect.any(Date),
            termosAceitosIp: expect.any(String),
            termosVersao: TERMOS_VERSAO,
            statusAssinatura: "PENDENTE_PAGAMENTO",
          }),
        }),
      );
    });

    it("não regride status quando unidade já está ATIVA e reaceita termos", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue({
        id: "assinatura-1",
        statusAssinatura: "ATIVA",
      });
      prismaMock.assinatura.update.mockResolvedValue({ statusAssinatura: "ATIVA" } as never);

      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceiteTermosUso: true, aceitePrivacidade: true, aceiteDebitoRecorrente: true }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.statusAssinatura).toBe("ATIVA");
    });

    it("retorna 404 quando assinatura não existe", async () => {
      authenticate();
      prismaMock.assinatura.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceiteTermosUso: true, aceitePrivacidade: true, aceiteDebitoRecorrente: true }),
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      expect(prismaMock.assinatura.update).not.toHaveBeenCalled();
    });
  });
});
