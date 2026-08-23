import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET,
  PATCH,
} from "@/app/api/v1/admin/backoffices/[id]/assinatura/route";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: { assinatura: { findUnique: vi.fn(), update: vi.fn() } },
}));

vi.mock("@/lib/audit", () => ({ criarAuditLog: vi.fn().mockResolvedValue(undefined) }));

type AdminAuth = { session: { user: { id: string; tipo: "ADMIN" } } | null; error: Response | null };
const requireAdminMock = vi.mocked(requireAdmin);
const prismaMock = vi.mocked(prisma);
const params = { params: { id: "backoffice-1" } };

function authenticate(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as Awaited<ReturnType<typeof requireAdmin>>);
}

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/backoffices/backoffice-1/assinatura", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API admin/backoffices/:id/assinatura — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireAdmin>>);
  });

  it("retorna 401 sem autenticação", async () => {
    const response = await PATCH(request({ acao: "LIBERAR" }), params);

    expect(response.status).toBe(401);
  });

  it("rejeita ação desconhecida", async () => {
    authenticate();

    const response = await PATCH(request({ acao: "INVALIDA" }), params);

    expect(response.status).toBe(400);
    expect(prismaMock.assinatura.findUnique).not.toHaveBeenCalled();
  });

  it("exige motivo para bloqueio", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue({
      id: "assinatura-1",
      statusAssinatura: "ATIVA",
    } as Awaited<ReturnType<typeof prisma.assinatura.findUnique>>);

    const response = await PATCH(request({ acao: "BLOQUEAR", motivo: " " }), params);

    expect(response.status).toBe(400);
    expect(prismaMock.assinatura.update).not.toHaveBeenCalled();
  });

  it("bloqueia a assinatura e registra a atualização", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue({
      id: "assinatura-1",
      statusAssinatura: "ATIVA",
    } as Awaited<ReturnType<typeof prisma.assinatura.findUnique>>);
    prismaMock.assinatura.update.mockResolvedValue({
      id: "assinatura-1",
      statusAssinatura: "BLOQUEADA_MANUAL",
    } as Awaited<ReturnType<typeof prisma.assinatura.update>>);

    const response = await PATCH(
      request({ acao: "BLOQUEAR", motivo: "Inadimplência" }),
      params,
    );

    expect(response.status).toBe(200);
    expect(prismaMock.assinatura.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { backofficeId: "backoffice-1" },
        data: expect.objectContaining({ statusAssinatura: "BLOQUEADA_MANUAL" }),
      }),
    );
  });

  it("retorna 404 quando a assinatura não existe", async () => {
    authenticate();
    prismaMock.assinatura.findUnique.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/admin/backoffices/backoffice-1/assinatura"),
      params,
    );

    expect(response.status).toBe(404);
  });
});
